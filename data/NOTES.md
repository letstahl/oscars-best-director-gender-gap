# Data notes

## Source

`raw/kaggle_oscar_award_demographics_1928-2025.csv` is the unmodified dataset from Kaggle:
[**The Oscar Award Demographics (1928–2025)**](https://www.kaggle.com/datasets/valettel/the-oscar-award-demographics-1928-2025)
by valettel. 2,330 rows covering all Academy Award categories and nominees from the 1st (1928)
through the 97th (2025) ceremony, with demographic fields (birth date, birth place, gender, race
or ethnicity, sexual orientation, religion).

## Transformation

`processed/oscars_best_director.csv` (484 rows) was derived from the raw file with the following
changes:

| Step | Description |
|---|---|
| Filter | Kept only rows where `Category` is the Best Director category (all other award categories dropped). |
| Rename / simplify | `Name` → `name`, `Film` → `film`, `Win_Oscar?` → `win` (0/1), `Year_Ceremony` → `year`, `Gender` → `gender`. |
| Derived column | `is_woman` (0/1), derived from `gender` for chart/pictogram logic. |
| Derived column | `nominees_count`, the number of Best Director nominees in that year's ceremony — used to plot the yearly nominee-count line. |
| Enrichment | `wiki_image_url` — a Wikipedia portrait photo URL looked up per director, added for the hover tooltips and pictogram. Not present in the original Kaggle dataset. |

Everything else (birth date, race/ethnicity, sexual orientation, religion) from the raw dataset
was dropped for this project since it's out of scope for the Best Director gender-gap story.

## Known data issue

The Wikipedia photo lookup for `wiki_image_url` matched on name only, with no manual
verification. One mismatch was found: `Richard Rush` (nominated 1981, *The Stunt Man*) was
pointing to a portrait of the 18th/19th-century US Attorney General of the same name, not the
film director. Fixed by looking up the director's own Wikipedia page
([pt.wikipedia.org](https://pt.wikipedia.org/wiki/Richard_Rush_(cineasta))) and replacing the URL
with his actual photo. Other name collisions may exist and haven't been individually checked.

## Known limitation

The dataset stops at the 97th ceremony (2025). The site's narrative is scoped entirely to this
97-ceremony window and does not reference the 98th Academy Awards or any later ceremony.
