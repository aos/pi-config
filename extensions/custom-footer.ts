/**
 * Jujutsu-aware footer — shows jj bookmarks + change ID instead of git branch.
 * Falls back to git branch detection for non-jj repos. Displays extension statuses.
 * Auto-enables on startup.
 *
 * Display format:
 *   ~/project (@ main | xtulknmu)    — with bookmark
 *   ~/project (@ xtulknmu)           — no bookmark
 *   ~/project (main)                   — git fallback
 *
 * Extension statuses shown right-aligned on pwd line (custom-footer hidden from display).
 */

import type { AssistantMessage } from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import {
  existsSync,
  readFileSync,
  statSync,
  watch,
  type FSWatcher,
} from "node:fs";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";

/** Walk up from cwd to find .jj directory. Returns repo root or null. */
function findJjRoot(): string | null {
  let dir = process.cwd();
  while (true) {
    const jjPath = join(dir, ".jj");
    try {
      if (existsSync(jjPath) && statSync(jjPath).isDirectory()) return dir;
    } catch {}
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** Fetch jj bookmark(s) and change ID for the working-copy commit. */
function fetchJjInfo(): string | null {
  try {
    return (
      execFileSync(
        "jj",
        [
          "log",
          "--no-graph",
          "-r",
          "@",
          "-T",
          'separate(" | ", self.bookmarks().join(", "), self.change_id().shortest(8))',
        ],
        {
          encoding: "utf8",
          timeout: 3000,
          stdio: ["ignore", "pipe", "ignore"],
        },
      ).trim() || null
    );
  } catch {
    return null;
  }
}

function formatTokens(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 10_000) return `${(count / 1000).toFixed(1)}k`;
  if (count < 1_000_000) return `${Math.round(count / 1000)}k`;
  if (count < 10_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  return `${Math.round(count / 1_000_000)}M`;
}

/** Read compaction.enabled from settings files, defaulting to true. */
function isAutoCompactEnabled(): boolean {
  const home = process.env.HOME || process.env.USERPROFILE || "";
  const paths = [
    join(home, ".pi", "agent", "settings.json"),
    join(process.cwd(), ".pi", "settings.json"),
  ];
  let enabled = true;
  for (const p of paths) {
    try {
      const settings = JSON.parse(readFileSync(p, "utf8"));
      if (settings.compaction?.enabled !== undefined)
        enabled = settings.compaction.enabled;
    } catch {}
  }
  return enabled;
}

export default function (pi: ExtensionAPI) {
  const jjRoot = findJjRoot();
  let footerActive = false;
  const autoCompact = isAutoCompactEnabled();

  function ensureFooter(ctx: {
    hasUI: boolean;
    ui: any;
    sessionManager: any;
    model: any;
  }) {
    if (!ctx.hasUI || footerActive) return;
    footerActive = true;

    ctx.ui.setFooter((tui: any, theme: any, footerData: any) => {
      const unsubGit = footerData.onBranchChange(() => tui.requestRender());

      let jjWatcher: FSWatcher | null = null;
      let cachedJjInfo: string | null | undefined;

      // Watch jj op_heads for changes — every jj operation writes a new op head
      if (jjRoot) {
        const opHeadsDir = join(jjRoot, ".jj", "repo", "op_heads", "heads");
        if (existsSync(opHeadsDir)) {
          try {
            jjWatcher = watch(opHeadsDir, () => {
              cachedJjInfo = undefined;
              tui.requestRender();
            });
          } catch {}
        }
      }

      function getJjInfo(): string | null {
        if (cachedJjInfo !== undefined) return cachedJjInfo;
        cachedJjInfo = fetchJjInfo();
        return cachedJjInfo;
      }

      return {
        dispose() {
          unsubGit();
          jjWatcher?.close();
          footerActive = false;
        },
        invalidate() {
          cachedJjInfo = undefined;
        },
        render(width: number): string[] {
          // ── pwd line ──────────────────────────────────────────
          let pwd = process.cwd();
          const home = process.env.HOME || process.env.USERPROFILE;
          if (home && pwd.startsWith(home)) pwd = `~${pwd.slice(home.length)}`;

          if (jjRoot) {
            const info = getJjInfo();
            if (info) pwd = `${pwd} (@ ${info})`;
          } else {
            const branch = footerData.getGitBranch();
            if (branch) pwd = `${pwd} (${branch})`;
          }

          const sessionName = ctx.sessionManager.getSessionName();
          if (sessionName) pwd = `${pwd} • ${sessionName}`;

          // Extension statuses right-aligned on pwd line
          const statuses = footerData.getExtensionStatuses();
          let statusStr = "";
          if (statuses.size > 0) {
            statusStr = Array.from(statuses.entries())
              .filter(([name]) => name !== "custom-footer")
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([, t]) =>
                t
                  .replace(/[\r\n\t]/g, " ")
                  .replace(/ +/g, " ")
                  .trim(),
              )
              .join(" | ");
          }
          const statusW = visibleWidth(statusStr);

          // Truncate pwd to leave room for status on the right
          const maxPwdW = statusW > 0 ? width - statusW - 2 : width;
          if (visibleWidth(pwd) > maxPwdW) {
            const half = Math.floor(maxPwdW / 2) - 2;
            if (half > 1)
              pwd = `${pwd.slice(0, half)}...${pwd.slice(-(half - 1))}`;
            else pwd = pwd.slice(0, Math.max(1, maxPwdW));
          }

          // ── stats line ────────────────────────────────────────
          let totalInput = 0,
            totalOutput = 0,
            totalCacheRead = 0,
            totalCacheWrite = 0,
            totalCost = 0;

          for (const entry of ctx.sessionManager.getEntries()) {
            if (
              entry.type === "message" &&
              entry.message.role === "assistant"
            ) {
              const m = entry.message as AssistantMessage;
              totalInput += m.usage.input;
              totalOutput += m.usage.output;
              totalCacheRead += m.usage.cacheRead;
              totalCacheWrite += m.usage.cacheWrite;
              totalCost += m.usage.cost.total;
            }
          }

          // Context % from last non-aborted assistant message
          const lastAssistant = ctx.sessionManager
            .getBranch()
            .slice()
            .reverse()
            .find(
              (e: any) =>
                e.type === "message" &&
                e.message.role === "assistant" &&
                e.message.stopReason !== "aborted",
            );
          const lastMsg =
            lastAssistant?.type === "message"
              ? (lastAssistant.message as AssistantMessage)
              : null;
          const ctxTokens = lastMsg
            ? lastMsg.usage.input +
              lastMsg.usage.output +
              lastMsg.usage.cacheRead +
              lastMsg.usage.cacheWrite
            : 0;
          const ctxWindow = ctx.model?.contextWindow || 0;
          const ctxPct = ctxWindow > 0 ? (ctxTokens / ctxWindow) * 100 : 0;

          const parts: string[] = [];
          if (totalInput) parts.push(`↑${formatTokens(totalInput)}`);
          if (totalOutput) parts.push(`↓${formatTokens(totalOutput)}`);
          if (totalCacheRead) parts.push(`R${formatTokens(totalCacheRead)}`);
          if (totalCacheWrite) parts.push(`W${formatTokens(totalCacheWrite)}`);
          if (totalCost) parts.push(`$${totalCost.toFixed(3)}`);

          const ctxDisplay = `${ctxPct.toFixed(1)}%/${formatTokens(ctxWindow)}${autoCompact ? " (auto)" : ""}`;
          if (ctxPct > 90) parts.push(theme.fg("error", ctxDisplay));
          else if (ctxPct > 70) parts.push(theme.fg("warning", ctxDisplay));
          else parts.push(ctxDisplay);

          let statsLeft = parts.join(" ");
          const statsLeftW = visibleWidth(statsLeft);

          // Right side: model + thinking level
          let right = ctx.model?.id || "no-model";
          if (ctx.model?.reasoning) {
            const lvl = pi.getThinkingLevel() || "off";
            right =
              lvl === "off" ? `${right} • thinking off` : `${right} • ${lvl}`;
          }
          if (footerData.getAvailableProviderCount() > 1 && ctx.model) {
            const withProv = `(${ctx.model.provider}) ${right}`;
            if (statsLeftW + 2 + visibleWidth(withProv) <= width)
              right = withProv;
          }

          const rightW = visibleWidth(right);
          let statsLine: string;
          if (statsLeftW + 2 + rightW <= width) {
            statsLine =
              statsLeft + " ".repeat(width - statsLeftW - rightW) + right;
          } else {
            const avail = width - statsLeftW - 2;
            if (avail > 3) {
              const tr = right.replace(/\x1b\[[0-9;]*m/g, "").slice(0, avail);
              statsLine =
                statsLeft + " ".repeat(width - statsLeftW - tr.length) + tr;
            } else {
              statsLine = statsLeft;
            }
          }

          const dimLeft = theme.fg("dim", statsLeft);
          const dimRight = theme.fg("dim", statsLine.slice(statsLeft.length));

          // Build pwd line with extension statuses right-aligned
          let pwdLine: string;
          const pwdW = visibleWidth(pwd);
          if (statusW > 0 && pwdW + 2 + statusW <= width) {
            const pad = " ".repeat(width - pwdW - statusW);
            pwdLine =
              theme.fg("dim", pwd) +
              theme.fg("dim", pad) +
              theme.fg("dim", statusStr);
          } else if (statusW > 0) {
            // Not enough room — truncate status
            const availStatus = width - pwdW - 2;
            if (availStatus > 3) {
              const truncStatus = truncateToWidth(statusStr, availStatus, "…");
              const pad = " ".repeat(width - pwdW - visibleWidth(truncStatus));
              pwdLine =
                theme.fg("dim", pwd) + theme.fg("dim", pad + truncStatus);
            } else {
              pwdLine = theme.fg("dim", pwd);
            }
          } else {
            pwdLine = theme.fg("dim", pwd);
          }

          return [pwdLine, dimLeft + dimRight];
        },
      };
    });
  }

  // Auto-enable: session_start covers initial load, turn_start covers /reload
  pi.on("session_start", async (_event, ctx) => ensureFooter(ctx));
  pi.on("turn_start", async (_event, ctx) => ensureFooter(ctx));
}
