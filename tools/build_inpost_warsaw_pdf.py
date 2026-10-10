from io import BytesIO
from pathlib import Path
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "InPost_BMX_Series_Warszawa_2027.pdf"
IMAGE = ROOT / "assets" / "inpost" / "inpost-park-pdf.jpg"

W, H = landscape(A4)
BLACK = HexColor("#090909")
PANEL = HexColor("#141414")
WHITE = HexColor("#F7F7F3")
MUTED = HexColor("#B5B5AF")
YELLOW = HexColor("#FFCB05")
LIME = HexColor("#C2FF1F")
LINE = Color(1, 1, 1, alpha=0.15)

pdfmetrics.registerFont(TTFont("Sans", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("Sans-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("Mono", "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"))
pdfmetrics.registerFont(TTFont("Mono-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"))


def bg(c, color=BLACK):
    c.setFillColor(color)
    c.rect(0, 0, W, H, fill=1, stroke=0)


def footer(c, page):
    c.setStrokeColor(LINE)
    c.line(34, 24, W - 34, 24)
    c.setFillColor(HexColor("#777777"))
    c.setFont("Mono", 6.5)
    c.drawString(34, 11, "BMX FREESTYLE EUROPEAN SERIES 2027  /  DEDYKOWANA OFERTA DLA InPost")
    c.drawRightString(W - 34, 11, f"0{page}")


def label(c, text, x, y, color=YELLOW):
    c.setFillColor(color)
    c.setFont("Mono-Bold", 7.5)
    c.drawString(x, y, text.upper())


def text_lines(c, text, x, y, max_width, font="Sans", size=11, leading=15, color=MUTED, max_lines=None):
    words = text.split()
    lines, current = [], ""
    for word in words:
        test = (current + " " + word).strip()
        if c.stringWidth(test, font, size) <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    if max_lines:
        lines = lines[:max_lines]
    c.setFont(font, size)
    c.setFillColor(color)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def cover(c):
    target_w, target_h = round(W * 1.6), round(H * 1.6)
    with Image.open(IMAGE) as source:
        source = source.convert("RGB")
        scale = max(target_w / source.width, target_h / source.height)
        resized = source.resize(
            (round(source.width * scale), round(source.height * scale)),
            Image.Resampling.LANCZOS,
        )
        left = (resized.width - target_w) // 2
        top = (resized.height - target_h) // 2
        background = resized.crop((left, top, left + target_w, top + target_h)).convert("RGBA")

    alpha_row = [
        round(255 * (0.08 + 0.86 * ((1 - x / (target_w - 1)) ** 1.65)))
        for x in range(target_w)
    ]
    alpha_mask = Image.new("L", (target_w, 1))
    alpha_mask.putdata(alpha_row)
    alpha_mask = alpha_mask.resize((target_w, target_h))
    fade = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 255))
    fade.putalpha(alpha_mask)
    background = Image.alpha_composite(background, fade).convert("RGB")

    cover_buffer = BytesIO()
    background.save(cover_buffer, format="JPEG", quality=90, optimize=True)
    cover_buffer.seek(0)
    c.drawImage(ImageReader(cover_buffer), 0, 0, W, H)
    c.setFillColor(YELLOW)
    c.rect(0, H - 16, W, 16, fill=1, stroke=0)
    c.setFillColor(BLACK)
    c.setFont("Mono-Bold", 6.5)
    c.drawCentredString(W / 2, H - 11, "DEDYKOWANA OFERTA DLA InPost  •  WARSZAWA  •  14-16 MAJA 2027")
    label(c, "BMX Freestyle European Series 2027", 44, H - 62)
    c.setFillColor(WHITE)
    c.setFont("Sans-Bold", 47)
    c.drawString(42, 244, "InPost W CENTRUM")
    c.setFillColor(YELLOW)
    c.drawString(42, 194, "WYDARZENIA.")
    c.setFillColor(WHITE)
    c.setFont("Sans-Bold", 14)
    c.drawString(45, 156, "Partner Główny i Wyłączny Partner Logistyczny")
    c.drawString(45, 137, "warszawskiej rundy serii.")
    c.setFillColor(Color(0, 0, 0, alpha=.82))
    c.roundRect(43, 47, 350, 62, 3, fill=1, stroke=0)
    items = [("TERMIN", "14-16 maja 2027"), ("MIASTO", "Warszawa")]
    x = 60
    for title, value in items:
        c.setFillColor(MUTED); c.setFont("Mono-Bold", 6); c.drawString(x, 87, title)
        c.setFillColor(WHITE); c.setFont("Sans-Bold", 10); c.drawString(x, 68, value)
        x += 160
    c.showPage()


def event_and_venues(c):
    bg(c)
    label(c, "01 — wydarzenie i lokalizacja", 38, H - 42)
    c.setFillColor(WHITE); c.setFont("Sans-Bold", 28)
    c.drawString(38, H - 82, "WARSZAWA OTWIERA SEZON 2027.")
    text_lines(c, "Trzydniowe międzynarodowe zawody w olimpijskiej dyscyplinie BMX Freestyle Park, połączone z miejskim festiwalem sportu i kultury. Wydarzenie będzie bezpłatne dla publiczności, z wejściem po rejestracji, profesjonalną transmisją oraz dedykowaną kampanią promocyjną.", 38, H - 112, 740, size=10, leading=14)
    stats = [("3", "dni wydarzenia"), ("150+", "docelowa liczba zawodników"), ("LIVE", "profesjonalna transmisja"), ("FREE ENTRY", "wstęp po wcześniejszej rejestracji")]
    sx, sy, sw = 38, 310, 185
    for i, (num, desc) in enumerate(stats):
        x = sx + i * (sw + 8)
        c.setFillColor(PANEL); c.roundRect(x, sy, sw, 82, 4, fill=1, stroke=0)
        c.setFillColor(YELLOW); c.setFont("Sans-Bold", 22 if num == "FREE ENTRY" else 25); c.drawString(x + 14, sy + 43, num)
        text_lines(c, desc, x + 14, sy + 21, sw - 26, size=7.5, leading=10, color=MUTED)
    c.setFillColor(WHITE); c.setFont("Sans-Bold", 15); c.drawString(38, 276, "ROZWAŻANE LOKALIZACJE")
    cards = [
        (38, 78, 460, 174, "OPCJA PIERWSZEGO WYBORU", "PARK FONTANN / WISŁOSTRADA", "Rozpoznawalna przestrzeń nad Wisłą z miejscem na park BMX, trybuny, strefę partnerów i program muzyczny. Lokalizacja łączy sport, miejski styl życia i weekendowy ruch mieszkańców."),
        (508, 78, 294, 174, "WARIANT ALTERNATYWNY", "OTOCZENIE PAŁACU KULTURY", "Ścisłe centrum Warszawy, bardzo dobra dostępność komunikacyjna i wysoka rozpoznawalność miejsca."),
    ]
    for i, (x, y, w, h, tag, title, desc) in enumerate(cards):
        c.setFillColor(HexColor("#2A2410") if i == 0 else PANEL); c.roundRect(x, y, w, h, 5, fill=1, stroke=0)
        label(c, tag, x + 18, y + h - 24)
        c.setFillColor(WHITE); c.setFont("Sans-Bold", 16 if i == 0 else 14); c.drawString(x + 18, y + h - 52, title)
        text_lines(c, desc, x + 18, y + h - 76, w - 36, size=8.5, leading=12)
    c.setFillColor(HexColor("#777777")); c.setFont("Mono", 6.5)
    c.drawString(38, 56, "Ostateczna lokalizacja po uzgodnieniach z Miastem Stołecznym Warszawa. Zakres praw partnera pozostaje bez zmian.")
    footer(c, 2); c.showPage()


def activation(c):
    bg(c)
    label(c, "02 — koncepcja obecności marki", 38, H - 42)
    c.setFillColor(WHITE); c.setFont("Sans-Bold", 29)
    c.drawString(38, H - 83, "PACZKOMAT, KTÓRY STAJE SIĘ CZĘŚCIĄ SPORTU.")
    c.drawImage(ImageReader(str(IMAGE)), 38, 83, 440, 330, preserveAspectRatio=True, anchor="c", mask="auto")
    c.setFillColor(YELLOW); c.rect(52, 96, 120, 19, fill=1, stroke=0)
    c.setFillColor(BLACK); c.setFont("Mono-Bold", 6); c.drawString(59, 103, "WIZUALIZACJA KONCEPCYJNA")
    x = 505
    c.setFillColor(WHITE); c.setFont("Sans-Bold", 17)
    c.drawString(x, 403, "MARKA OTRZYMUJE ROLĘ,")
    c.drawString(x, 382, "NIE TYLKO EKSPOZYCJĘ.")
    text_lines(c, "Centralna przeszkoda stylizowana na Paczkomat może być pełnoprawnym elementem parku, najbardziej rozpoznawalnym punktem transmisji i naturalnym tłem dla materiałów zawodników.", x, 350, 292, size=9, leading=13)
    benefits = [
        ("01", "Dedykowana przeszkoda BMX inspirowana urządzeniem Paczkomatem."),
        ("02", "InPost Best Trick - własny segment sportowy marki."),
        ("03", "Strefa marki i aktywacja powiązana z aplikacją InPost Mobile."),
        ("04", "Treści z zawodnikami przed wydarzeniem, podczas rundy i po finale."),
    ]
    y = 280
    for no, desc in benefits:
        c.setStrokeColor(LINE); c.line(x, y + 12, 802, y + 12)
        c.setFillColor(YELLOW); c.setFont("Mono-Bold", 7); c.drawString(x, y - 6, no)
        text_lines(c, desc, x + 30, y - 4, 267, size=8.5, leading=11, color=WHITE)
        y -= 47
    footer(c, 3); c.showPage()


def commercial(c):
    bg(c)
    label(c, "03 — zakres i warunki", 38, H - 42)
    c.setFillColor(WHITE); c.setFont("Sans-Bold", 27)
    c.drawString(38, H - 80, "KONKRETNY ZAKRES. JASNA INWESTYCJA.")
    rights = [
        ("STATUS", "Partner Główny i Wyłączny Partner Logistyczny rundy warszawskiej."),
        ("WYŁĄCZNOŚĆ", "Usługi kurierskie, logistyczne oraz dostawy przesyłek."),
        ("PARK I EVENT", "Dominująca obecność na przeszkodzie, wybranych powierzchniach parku i w strefie wydarzenia."),
        ("KAMPANIA", "Obecność w kluczowych materiałach, płatnej kampanii digital, stronie i systemie rejestracji."),
        ("TRANSMISJA", "Identyfikacja partnera, InPost Best Trick, highlights oraz pakiet zdjęć i materiałów wideo."),
        ("AKTYWACJA", "Strefa marki do 50 m², konkursy, komunikaty sceniczne i 20 zaproszeń hospitality."),
        ("RAPORT", "Frekwencja, kampania, transmisja, publikacje i dokumentacja świadczeń do 21 dni po wydarzeniu."),
    ]
    y = 438
    for title, desc in rights:
        c.setStrokeColor(LINE); c.line(38, y + 8, 500, y + 8)
        c.setFillColor(YELLOW); c.setFont("Mono-Bold", 7); c.drawString(38, y - 7, title)
        text_lines(c, desc, 138, y - 6, 350, size=8.2, leading=11, color=WHITE)
        y -= 49
    c.setFillColor(YELLOW); c.roundRect(528, 267, 274, 187, 6, fill=1, stroke=0)
    c.setFillColor(BLACK); c.setFont("Mono-Bold", 7); c.drawString(549, 426, "INWESTYCJA PARTNERSKA")
    c.setFont("Sans-Bold", 34); c.drawString(548, 373, "150 000")
    c.setFont("Sans-Bold", 13); c.drawString(550, 350, "PLN NETTO")
    text_lines(c, "W cenie: prawa partnerskie, wyłączność kategorii, standardowe oznakowanie, kampania, transmisja, treści i przestrzeń aktywacyjna.", 550, 316, 230, size=8, leading=11, color=BLACK)
    c.setFillColor(PANEL); c.roundRect(528, 130, 274, 116, 6, fill=1, stroke=0)
    label(c, "Wycena odrębna", 549, 220)
    text_lines(c, "Projekt techniczny, produkcja i montaż niestandardowej przeszkody stylizowanej na Paczkomat oraz ponadstandardowa produkcja aktywacji.", 549, 196, 232, size=8.2, leading=12, color=WHITE)
    c.setFillColor(WHITE); c.setFont("Sans-Bold", 11); c.drawString(38, 62, "Paweł Jaworski")
    c.setFillColor(MUTED); c.setFont("Sans", 7.5); c.drawString(38, 48, "Urban Sports Foundation  ·  pjaworski@urbansports.foundation  ·  +48 605 170 000")
    footer(c, 4); c.showPage()


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=(W, H), pageCompression=1)
    c.setTitle("InPost x BMX Freestyle European Series - Warszawa 2027")
    c.setAuthor("Urban Sports Foundation")
    cover(c)
    event_and_venues(c)
    activation(c)
    commercial(c)
    c.save()
    print(OUT)


if __name__ == "__main__":
    main()
