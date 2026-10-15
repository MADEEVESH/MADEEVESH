#!/usr/bin/env python3
"""Build the Play icon and splash from the StormBreaker axe on the website."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "resources" / "stormbreaker-mark.png"
OUT = ROOT / "resources"
NAVY = (12, 27, 46, 255)
CREAM = (244, 247, 251, 255)
MUTED = (168, 188, 210, 255)
INTER_BOLD = "/usr/share/fonts/truetype/macos/Inter-Bold.ttf"
INTER_MEDIUM = "/usr/share/fonts/truetype/macos/Inter-Medium.ttf"


def prepare_mark() -> Image.Image:
    mark = Image.open(SOURCE).convert("RGBA")
    pixels = mark.load()
    width, height = mark.size
    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            if alpha == 0:
                continue
            whitest = min(red, green, blue)
            if whitest >= 248:
                pixels[x, y] = (red, green, blue, 0)
            elif whitest >= 236 and max(red, green, blue) - whitest < 14:
                fade = (248 - whitest) / 12
                pixels[x, y] = (red, green, blue, int(alpha * fade))
    bbox = mark.getbbox()
    if bbox:
        mark = mark.crop(bbox)
    return mark


def fit(mark: Image.Image, max_width: int, max_height: int) -> Image.Image:
    scale = min(max_width / mark.width, max_height / mark.height)
    size = (max(1, round(mark.width * scale)), max(1, round(mark.height * scale)))
    return mark.resize(size, Image.Resampling.LANCZOS)


def canvas(size: int) -> Image.Image:
    image = Image.new("RGBA", (size, size), NAVY)
    return image


def paste_center(base: Image.Image, sprite: Image.Image, center) -> None:
    x = round(center[0] - sprite.width / 2)
    y = round(center[1] - sprite.height / 2)
    base.alpha_composite(sprite, (x, y))


def render_icon(mark: Image.Image) -> Image.Image:
    image = canvas(1024)
    # Stay inside the Android adaptive-icon safe circle.
    sprite = fit(mark, int(1024 * 0.46), int(1024 * 0.64))
    paste_center(image, sprite, (512, 512))
    return image


def render_foreground(mark: Image.Image) -> Image.Image:
    image = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    # capacitor-assets insets the foreground by 16.7%, which places this
    # whole image inside the adaptive-icon safe circle.
    sprite = fit(mark, int(1024 * 0.78), int(1024 * 0.92))
    paste_center(image, sprite, (512, 512))
    return image


def render_background() -> Image.Image:
    return canvas(1024)


def render_splash(mark: Image.Image) -> Image.Image:
    image = canvas(2732)
    sprite = fit(mark, 900, 1280)
    paste_center(image, sprite, (1366, 1180))
    draw = ImageDraw.Draw(image)
    title = ImageFont.truetype(INTER_BOLD, 132)
    subtitle = ImageFont.truetype(INTER_MEDIUM, 48)
    title_text = "ServiceSite"
    subtitle_text = "Websites and bookings"
    title_box = draw.textbbox((0, 0), title_text, font=title)
    subtitle_box = draw.textbbox((0, 0), subtitle_text, font=subtitle)
    title_x = (2732 - (title_box[2] - title_box[0])) / 2
    subtitle_x = (2732 - (subtitle_box[2] - subtitle_box[0])) / 2
    draw.text((title_x, 1960), title_text, font=title, fill=CREAM)
    draw.text((subtitle_x, 2140), subtitle_text, font=subtitle, fill=MUTED)
    return image


def main() -> None:
    mark = prepare_mark()
    OUT.mkdir(parents=True, exist_ok=True)
    render_icon(mark).convert("RGB").save(OUT / "icon-only.png", optimize=True)
    render_foreground(mark).save(OUT / "icon-foreground.png")
    render_background().convert("RGB").save(OUT / "icon-background.png", optimize=True)
    splash = render_splash(mark).convert("RGB")
    splash.save(OUT / "splash.png", optimize=True)
    splash.save(OUT / "splash-dark.png", optimize=True)
    print(f"mark {mark.size}")
    print("wrote icon, foreground, background, splash")


if __name__ == "__main__":
    main()
