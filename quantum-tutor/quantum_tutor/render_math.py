"""Render a LaTeX/math expression to PNG and display it inline via the
Kitty graphics protocol (natively supported by Ghostty).

Usage:
    render_math.py "\\psi(x) = A e^{ikx}"
    render_math.py --block "\\int_{-\\infty}^{\\infty} |\\psi(x)|^2\\,dx = 1"
    echo "\\hat{H}\\psi = E\\psi" | render_math.py --block -
"""
import argparse
import base64
import io
import sys

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

CHUNK_SIZE = 4096


def render_png(expr: str, fontsize: int, fg: str) -> bytes:
    fig = plt.figure(figsize=(0.01, 0.01))
    text = fig.text(0, 0, f"${expr}$", fontsize=fontsize, color=fg)
    fig.canvas.draw()
    bbox = text.get_window_extent()
    w, h = bbox.width / fig.dpi, bbox.height / fig.dpi
    fig.set_size_inches(w + 0.2, h + 0.2)
    text.set_position((0.04, 0.08))
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=200, transparent=True)
    plt.close(fig)
    return buf.getvalue()


def display_kitty(png_bytes: bytes) -> None:
    data = base64.b64encode(png_bytes)
    for i in range(0, len(data), CHUNK_SIZE):
        chunk = data[i : i + CHUNK_SIZE].decode("ascii")
        more = 1 if i + CHUNK_SIZE < len(data) else 0
        control = f"a=T,f=100,m={more}" if i == 0 else f"m={more}"
        sys.stdout.write(f"\x1b_G{control};{chunk}\x1b\\")
    sys.stdout.write("\n")
    sys.stdout.flush()


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("expr", help="LaTeX expression, or '-' to read from stdin")
    p.add_argument("--block", action="store_true", help="Larger block-equation size")
    p.add_argument("--fontsize", type=int, default=None)
    p.add_argument(
        "--light", action="store_true",
        help="Dark text for light-background terminals (default: light text)",
    )
    args = p.parse_args()

    expr = sys.stdin.read().strip() if args.expr == "-" else args.expr
    fontsize = args.fontsize or (20 if args.block else 14)
    fg = "black" if args.light else "white"

    display_kitty(render_png(expr, fontsize, fg))


if __name__ == "__main__":
    main()
