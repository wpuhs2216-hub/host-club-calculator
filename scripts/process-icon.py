#!/usr/bin/env python3
"""
PWAアイコン生成スクリプト
使い方: python3 scripts/process-icon.py public/source-icon.png

- 暗い背景を透過処理
- 512x512 (any) と 192x192 (any) を生成
- maskable版 (背景付き) も生成
"""
import sys
from PIL import Image
import numpy as np

def process_icon(source_path: str):
    img = Image.open(source_path).convert("RGBA")
    data = np.array(img)

    # 暗い背景ピクセルを透過 (RGB各チャンネルが40以下のピクセル)
    dark_mask = (data[:, :, 0] < 40) & (data[:, :, 1] < 40) & (data[:, :, 2] < 50)
    data[dark_mask, 3] = 0  # アルファを0に

    img_transparent = Image.fromarray(data)

    # コンテンツ領域をトリミング (透過でない部分のバウンディングボックス)
    bbox = img_transparent.getbbox()
    if bbox:
        img_cropped = img_transparent.crop(bbox)
    else:
        img_cropped = img_transparent

    # 正方形にする (長い辺に合わせてパディング)
    w, h = img_cropped.size
    size = max(w, h)
    # 少し余白を追加 (5%)
    padding = int(size * 0.05)
    canvas_size = size + padding * 2

    # any版 (透過背景)
    canvas_any = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    offset = ((canvas_size - w) // 2, (canvas_size - h) // 2)
    canvas_any.paste(img_cropped, offset, img_cropped)

    # maskable版 (背景色: #0a0e17)
    canvas_mask = Image.new("RGBA", (canvas_size, canvas_size), (10, 14, 23, 255))
    canvas_mask.paste(img_cropped, offset, img_cropped)

    # 512x512
    icon_512_any = canvas_any.resize((512, 512), Image.LANCZOS)
    icon_512_any.save("public/icon-512.png")
    print("Saved: public/icon-512.png (512x512, transparent)")

    icon_512_mask = canvas_mask.resize((512, 512), Image.LANCZOS)
    icon_512_mask.save("public/icon-512-maskable.png")
    print("Saved: public/icon-512-maskable.png (512x512, with background)")

    # 192x192
    icon_192_any = canvas_any.resize((192, 192), Image.LANCZOS)
    icon_192_any.save("public/icon-192.png")
    print("Saved: public/icon-192.png (192x192, transparent)")

    icon_192_mask = canvas_mask.resize((192, 192), Image.LANCZOS)
    icon_192_mask.save("public/icon-192-maskable.png")
    print("Saved: public/icon-192-maskable.png (192x192, with background)")

    print("\nDone! Update manifest.json to use the new icons.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/process-icon.py <source-image.png>")
        sys.exit(1)
    process_icon(sys.argv[1])
