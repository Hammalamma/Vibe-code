# Gættespil: computeren tænker på et tal, og du skal gætte det.

import random  # Henter et værktøj, der kan lave tilfældige tal
import os      # Henter et værktøj til at arbejde med filer og mapper

MAKS_TAL = 1000      # Det højeste tal, computeren kan vælge
MAKS_FORSØG = 10     # Så mange gæt har spilleren

# Rekorden gemmes i filen rekord.txt, i samme mappe som spillet
REKORD_FIL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rekord.txt")


def hent_rekord():
    """Læser den bedste score fra filen. Giver None, hvis der ikke er nogen endnu."""
    if not os.path.exists(REKORD_FIL):
        return None
    with open(REKORD_FIL) as fil:
        indhold = fil.read().strip()
    if indhold.isdigit():
        return int(indhold)
    return None


def gem_rekord(forsøg):
    """Skriver den nye bedste score ned i filen."""
    with open(REKORD_FIL, "w") as fil:
        fil.write(str(forsøg))


def spil_en_runde():
    """Spiller ét spil og returnerer antal forsøg, hvis man vinder, ellers None."""
    hemmeligt_tal = random.randint(1, MAKS_TAL)
    antal_forsøg = 0

    print(f"\nJeg tænker på et tal mellem 1 og {MAKS_TAL}. Du har {MAKS_FORSØG} forsøg.")

    while antal_forsøg < MAKS_FORSØG:  # Bliv ved, så længe der er forsøg tilbage
        svar = input("Dit gæt: ")

        if not svar.isdigit():  # Tjek at der faktisk er skrevet et tal
            print("Skriv venligst et helt tal.")
            continue

        gæt = int(svar)  # Lav teksten om til et tal
        antal_forsøg += 1
        tilbage = MAKS_FORSØG - antal_forsøg

        if gæt == hemmeligt_tal:
            print(f"Rigtigt! Tallet var {hemmeligt_tal}. Du brugte {antal_forsøg} forsøg.")
            return antal_forsøg
        elif gæt < hemmeligt_tal:
            print(f"For lavt! ({tilbage} forsøg tilbage)")
        else:
            print(f"For højt! ({tilbage} forsøg tilbage)")

    print(f"Du tabte! Tallet var {hemmeligt_tal}.")
    return None


# ---- Her starter programmet ----

print("Velkommen til gættespillet!")

rekord = hent_rekord()
if rekord is None:
    print("Der er ingen rekord endnu. Bliv den første!")
else:
    print(f"Den nuværende rekord er {rekord} forsøg.")

while True:  # Bliv ved med at spille, indtil spilleren vil stoppe
    resultat = spil_en_runde()

    # Ny rekord, hvis man vandt med færre forsøg end før
    if resultat is not None and (rekord is None or resultat < rekord):
        rekord = resultat
        gem_rekord(rekord)
        print(f"NY REKORD: {rekord} forsøg!")
    elif rekord is not None:
        print(f"Rekorden er stadig {rekord} forsøg.")

    igen = input("\nVil du spille igen? (j/n): ")
    if igen.strip().lower() != "j":
        print("Tak for spillet!")
        break  # Stop løkken: programmet er slut
