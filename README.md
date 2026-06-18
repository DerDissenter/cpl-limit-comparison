# CPL Limit Comparison Tool – Kurzanleitung

Mit dem Tool kannst du CPL-Spieler importieren, Tryouts bewerten und Spieler über mehrere Seasons miteinander vergleichen.

## 1. Limit Comparison

In der **Limit Comparison** kannst du mehrere Spieler miteinander vergleichen.

Du kannst Spieler entweder manuell einfügen, aus gespeicherten Spielern auswählen oder per Team-Import laden.

Verglichen werden nicht die aktuellen Skills, sondern die **Limits** der Spieler. Zusätzlich können Heart-Bonus, Gewichtungen, Special Abilities und Age Decay berücksichtigt werden.

### Möglichkeiten

* Mehrere Spieler gleichzeitig vergleichen
* Skills auswählen, die in den Vergleich einfließen sollen
* Eigene Gewichtung pro Skill setzen
* Heart-Bonus berechnen lassen
* Loyal, Fragger und Tryhard berücksichtigen
* Age Decay optional aktivieren
* Analysis Feature optional aktivieren, um den Alterungsabzug zu reduzieren
* Spieler speichern und später erneut laden

## 2. Team Import

Über den **Team Import** kannst du Spieler direkt anhand einer Team-ID importieren.

Das Tool lädt dafür die öffentliche Player-Ranking-Tabelle und sucht daraus die Spieler des angegebenen Teams heraus. Es werden nur Spieler berücksichtigt, die einem Lineup zugeteilt sind.

### Ablauf

1. Team-ID eingeben
2. Import starten
3. Warten, bis die Ranking-Daten geladen wurden
4. Spieler im Dropdown auswählen
5. Spieler zur Comparison hinzufügen

Der erste Import kann etwas länger dauern, da zunächst alle Ranking-Seiten geladen werden müssen. Danach werden die Ranking-Daten im Browser gespeichert und erst nach 24 Stunden neu geladen.

## 3. Tryout Analyzer

Im **Tryout Analyzer** kannst du Tryout-Daten einfügen und automatisch auswerten lassen.

Das Tool erkennt Name, Alter, Geburtstag, Skills, sichtbare Limits und versteckte `?`-Limits.

### Was der Tryout Analyzer macht

* Tryout-Daten automatisch parsen
* Versteckte `?`-Limits schätzen
* Manuelle Limit-Anpassungen erlauben
* Bis zu 5 Extra-Limitpunkte verteilen
* Limits von 80–100 beachten
* Top4-Cap und Total-Cap berücksichtigen
* Spieler von S bis C bewerten:

  * Total
  * Top4
  * Birthday
  * Combined
* Academy-Matches berechnen
* EXP-Level berechnen
* Leadership-Level berechnen
* Leader-Icon optional berücksichtigen
* Fertigen Tryout als 20yo Spieler speichern
* Spieler anschließend in der Limit Comparison verwenden

## 4. Community Stats

Die **Community Stats** zeigen aktuelle Daten für Community 121.

### Inhalte

* Community-Teams mit Ranking, Division/League Position, Fame und Ladder Position
* Ranking-Trend im Vergleich zum Endstand der vorherigen Season
* Team-Suche nach Name oder Manager
* Sortierung nach Ranking, League Position, Fame und Ladder Position
* Community-Spieler aus der aktuellen Season-Rankingliste
* Spielerfilter nach Team sowie Suche nach Name oder Nick

## 5. Schätzmodus für versteckte Limits

Bei Tryouts sind manche Limits mit `?` maskiert. Dafür gibt es zwei Modi:

### Average Distribution

Die fehlenden Limits werden möglichst gleichmäßig auf die versteckten Skills verteilt.

### Weighted Best Distribution

Die fehlenden Limits werden anhand deiner eingestellten Skill-Gewichtung verteilt. Skills mit höherer Gewichtung erhalten dabei bevorzugt bessere geschätzte Limits.

Du kannst einzelne `?`-Limits auch manuell eintragen. Die übrigen versteckten Limits werden danach automatisch neu berechnet.

## 6. Speicherung im Browser

Das Tool speichert deine Eingaben lokal im Browser.

Gespeichert werden unter anderem:

* gespeicherte Spieler
* Tryout-Daten
* Gewichtungen
* ausgewählte Skills
* importierte Team-Spieler
* Ranking-Daten für den Team-Import
* letzte Einstellungen

Wichtig: Die Daten werden nur im Browser gespeichert. Wenn du ein anderes Gerät oder einen anderen Browser verwendest, sind die gespeicherten Daten dort nicht automatisch vorhanden.
