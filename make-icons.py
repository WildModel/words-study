from PIL import Image, ImageDraw, ImageFont

for size in (180, 192, 512):
    image = Image.new('RGB', (size, size), '#315f4d')
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Georgia Bold.ttf', int(size * .62))
    box = draw.textbbox((0, 0), 'W', font=font)
    draw.text(((size - (box[2] - box[0])) / 2, size * .13 - box[1]), 'W', font=font, fill='#eef7ef')
    radius = size * .035
    draw.ellipse((size * .75 - radius, size * .76 - radius, size * .75 + radius, size * .76 + radius), fill='#f2a984')
    image.save(f'icon-{size}.png')
