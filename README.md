## Actions tracking :

1. **displayPopup**   
`background --> popupScript`
    - linkType
    - isSafe

2. **fetchAndParse** 
`background --> parserScript`
    - url (proxiedUrl)
    - linkType
    - plainUrl

3. **summarizeText** 
`parserScript --> background`
    - text
    - title
    - url
    - linkType

4. **createPopup** 
`popupScript --> background --> popupHTML`
    - linkType
    - isSafe

5. **updatePopup** 
`background --> popupScript`
    - summaryText
    - title
    - url

6. **saveBookmark** 
`popupScript --> background --> bookmarkScript`
    - data (bookmarkData -> {id, title, summary, url})

7. **displayBookmarks** 
`popupHTML --> background --> popupHTML`
    - flag (checks if bookmarks drawer is open or close)

8. **deleteBookmark**
`popupHTML --> background --> bookmarkScript`
    - id (bookmark's)



## To-do :

- [x] bookmark contains the url of the website the link was bookmarked in no the bookmarked websites link, change asap.
    `popupScript.js -> bookmarkHandler() `
- [ ] show some sort of verification when the bookmark is saved.
- [ ] Move remove bookmark function to bookmarkScript.js from popupHTML.
- [ ] add website ratings using virustotal api
- [ ] document better if possible
- [ ] clear all local storage button
- [ ] exception handling

