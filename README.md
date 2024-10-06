## Actions tracking :

1. **displayPopup**   
`background --> popupScript`

2. **fetchAndParse** 
`background --> parserScript`

3. **summarizeText** 
`parserScript --> background`

4. **createPopup** 
`popupScript --> background --> popupHTML`

5. **updatePopup** 
`background --> popupScript`

6. **bookmark** 
`popupScript --> background --> bookmarkScript`

7. **displayBookmarks** 
`popupHTML --> background --> popupHTML`





## To-do :

- [x] bookmark contains the url of the website the link was bookmarked in no the bookmarked websites link, change asap.
    `popupScript.js -> bookmarkHandler() `
- [ ] show some sort of verification when the bookmark is saved.
- [ ] Move remove bookmark function to bookmarkScript.js from popupHTML.
- [ ] add website ratings using virustotal api
- [ ] document better if possible
- [ ] clear all local storage button

