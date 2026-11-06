"""Generate DAKA PNG/ICO assets for Electron builder (run in CI or locally)."""
from pathlib import Path
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    import subprocess

    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow", "-q"])
    from PIL import Image, ImageDraw, ImageFont


def logo(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    m = max(2, size // 16)
    d.rounded_rectangle(
        [m, m, size - m - 1, size - m - 1],
        radius=size // 5,
        fill=(62, 83, 68, 255),
    )
    text = "DAKA"
    font = ImageFont.load_default()
    for candidate in (
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/segoeuib.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ):
        try:
            font = ImageFont.truetype(candidate, max(12, size // 5))
            break
        except Exception:
            continue
    bbox = d.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1]
    d.text((x, y), text, fill=(247, 243, 234, 255), font=font)
    return img


def main() -> None:
    root = Path(__file__).resolve().parents[2]
    build = root / "desktop" / "build"
    assets = root / "desktop" / "assets"
    www = root / "www"
    build.mkdir(parents=True, exist_ok=True)
    assets.mkdir(parents=True, exist_ok=True)
    www.mkdir(parents=True, exist_ok=True)

    logo(512).save(build / "icon.png")
    logo(256).save(assets / "icon-256.png")
    logo(192).save(www / "logo-daka.png")

    sizes = [16, 32, 48, 64, 128, 256]
    images = [logo(s) for s in sizes]
    images[-1].save(build / "icon.ico", format="ICO", sizes=[(s, s) for s in sizes])
    print("icons ready:", build / "icon.ico")


if __name__ == "__main__":
    main()
