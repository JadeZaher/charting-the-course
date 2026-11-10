# Data status (10 November 2026)

This note replaces the older mock inventory. The pages below use the live API or say when a record is absent.

## Admin

`AdminPanel` is the node-administration surface (`pages/node-admin/NodeAdministration.tsx`). It loads support records from the API. It does not ship a list of fake users or courses.

## Dashboard media

The dashboard does not embed a video. When the selected ecosystem has an image URL, that image is shown. Otherwise the panel is a network-scope label and a count. There is no "video will be embedded here" placeholder.

## Quizzes

- Completed quizzes on the profile, the public profile, and My Quiz History use the quiz title from the API. A missing title reads "Untitled quiz".
- My Quiz History lists quizzes the membership marks in progress and links to the quiz. Unfinished answers are not restored; a quiz is saved when it is submitted.
- Member profiles link in-progress and not-started quizzes to the same take page, with the same limit stated on the card.
- Quiz Management can assign a quiz to one member (`/api/v1/quiz-assignments`) and remove that assignment. The API used here does not assign a quiz to a team.

## Public pages

`/`, `/communities`, `/about`, `/governance-model`, `/terms`, and `/privacy` are prerendered into the first HTML response, with `robots.txt` and `sitemap.xml`.
