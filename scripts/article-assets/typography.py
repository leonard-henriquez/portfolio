"""Use the portfolio's bundled fonts for both chart measurement and standalone SVGs."""
from base64 import b64encode
from pathlib import Path
from tempfile import TemporaryDirectory

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from matplotlib import font_manager

REPO = Path(__file__).resolve().parents[2]
GROTESK = REPO / 'node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2'
MONO = REPO / 'node_modules/@fontsource/space-mono/files/space-mono-latin-400-normal.woff2'
_fonts = TemporaryDirectory(prefix='portfolio-chart-fonts-')


def register_fonts():
    """Matplotlib needs sfnt fonts; derive them from the exact installed web fonts."""
    for weight, style in [(400, 'Regular'), (700, 'Bold')]:
        font = instantiateVariableFont(TTFont(GROTESK), {'wght': weight}, inplace=True)
        # The variable source's legacy family is "Space Grotesk Light". Normalize
        # both naming tables so FreeType matches the CSS family at every weight.
        for record in font['name'].names:
            if record.nameID in [1, 16]:
                record.string = 'Space Grotesk'.encode(record.getEncoding())
            elif record.nameID in [2, 17]:
                record.string = style.encode(record.getEncoding())
        for name_id in [2, 17]:
            font['name'].setName(style, name_id, 3, 1, 0x409)
        font.flavor = None
        path = Path(_fonts.name) / f'grotesk-{weight}.ttf'
        font.save(path)
        font_manager.fontManager.addfont(str(path))
    font = TTFont(MONO)
    font.flavor = None
    path = Path(_fonts.name) / 'mono.ttf'
    font.save(path)
    font_manager.fontManager.addfont(str(path))


def font_css():
    """Data URLs work in standalone SVGs and SVGs loaded through an HTML img."""
    return '\n'.join(
        f"@font-face{{font-family:'{family}';font-style:normal;font-weight:{weight};"
        f"src:url(data:font/woff2;base64,{b64encode(path.read_bytes()).decode()}) format('woff2');}}"
        for family, weight, path in [('Space Grotesk', '300 700', GROTESK), ('Space Mono', '400', MONO)]
    )


def embed_fonts(svg):
    return svg.replace('<defs>', '<defs><style type="text/css">' + font_css() + '</style>', 1)
