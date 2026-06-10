from pathlib import Path
from PIL import Image

LOGO_PNG = Path(__file__).with_name('logo.png')
OUTPUT = Path(__file__).with_name('bluewhale_icon.ico')
SIZES = [256, 128, 64, 48, 32, 16]


def create_transparent_logo(image: Image.Image) -> Image.Image:
    image = image.convert('RGBA')
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            if r < 30 and g < 30 and b < 30:
                pixels[x, y] = (0, 0, 0, 0)
    return image


def main() -> None:
    if not LOGO_PNG.exists():
        raise FileNotFoundError(f'Logo file not found: {LOGO_PNG}')

    original = Image.open(LOGO_PNG)
    original = create_transparent_logo(original)

    icons = []
    for size in SIZES:
        icon = original.copy()
        icon.thumbnail((size, size), Image.Resampling.LANCZOS)
        canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        offset_x = (size - icon.width) // 2
        offset_y = (size - icon.height) // 2
        canvas.paste(icon, (offset_x, offset_y), icon)
        icons.append(canvas)

    icons[0].save(OUTPUT, format='ICO', sizes=[(s, s) for s in SIZES])
    print(f'Created icon: {OUTPUT}')


if __name__ == '__main__':
    main()
