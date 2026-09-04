![Portfolio Preview](day4.gif)

# Aaron Mills Portfolio

This is my personal portfolio website built with Next.js, showcasing my projects and professional experience.

## Features
- Modern, responsive design
- Project showcase
- Professional experience
- Contact information
- Social media links

## Header search

Search matches fragments of Project and Writings button labels; for example, `t ha` finds **Habit Hall**. Results show the card and section on the right, such as `Websites | Projects`. Navigation, social, and carousel controls are not indexed.

- Use Up/Down to select a result. Enter (or clicking a result) reveals its carousel page, scrolls to the real button, and moves keyboard focus there. Press Enter again to open it.
- Type `section: wr` and choose **Writings** to apply a rounded section tag immediately. When typing a complete name such as `section: Projects`, press Space after the name to turn it into a tag. Continue typing beside the tag to narrow its buttons.
- With only the **section: Projects** tag and no result selected, Enter scrolls to Projects. Braced names such as `section: {Projects}` also work. Use the tag's × to remove its filter without clearing your search text, or Backspace when the text field is empty.
- Escape closes suggestions; the clear button removes both the query and section filter.

Project and Writings cards share `src/data/siteContent.ts` with the search index. Add buttons to a card's `links` array with a stable unique `id`, `text`, and `href`; they become searchable automatically, including on later carousel pages. Writings cards currently have no links.

Run search tests with `npm test`, the production build with `npm run build`, and the local preview with `npm run dev`.
