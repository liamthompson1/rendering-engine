// The hotels.md source — pure GFM markdown.
// No :::directives. No ::leaf-directives. No special syntax.
// Just headings, paragraphs, lists, blockquotes, images, links — exactly
// what an LLM produces if you ask it to write a hotel listing.
//
// The shape of the rendered UI is inferred from STRUCTURE, not from named
// blocks the author had to know about. Frontmatter tells the renderer
// "this is a listing page" — that's the only configuration.
export const SOURCE_MD = `---
title: Hotels at Manchester Airport
template: listing
data: data/hotels.json
---

# Hotels at Manchester Airport

{{#each products}}
## {{name}}

![{{name}}]({{logoUrl}})

{{#if highlight}}> {{highlight}}{{/if}}

{{location}} · ★ {{stars}} · {{rating}}/10

**Hotel packages from £{{price}}**

{{#each badges}}- {{this}}
{{/each}}

{{description}}

{{#if packageCount}}[Show Packages ({{packageCount}})]({{links.packages}}){{else}}[Choose]({{links.choose}}){{/if}}

{{/each}}
`;

// data/hotels.json — same as before. Two products, one with highlight +
// packageCount, one without, so both {{#if}} branches fire.
export const DATA_JSON = {
  products: [
    {
      id: "crowne-plaza-t1",
      name: "Crowne Plaza Manchester Airport T1",
      stars: 4,
      logoUrl: "https://picsum.photos/seed/crowne-plaza-t1/1200/600",
      highlight: "Walk to T1 in 5 minutes",
      location: "Adjacent to Terminal 1",
      price: "129.00",
      rating: 8.6,
      badges: ["Flextras: Free Cancellation", "Never Beaten on Price"],
      description:
        "Modern 4-star hotel a 5-minute walk from T1 with restaurant, bar and free wifi.",
      packageCount: 4,
      links: {
        map: "/hotel/crowne-plaza-t1/map",
        photos: "/hotel/crowne-plaza-t1/photos",
        packages: "/hotel/crowne-plaza-t1/packages",
        reviews: "/hotel/crowne-plaza-t1/reviews",
      },
    },
    {
      id: "hilton-garden",
      name: "Hilton Garden Inn",
      stars: 4,
      logoUrl: "https://picsum.photos/seed/hilton-garden-inn/1200/600",
      location: "10 min by hotel shuttle",
      price: "108.50",
      rating: 8.2,
      badges: ["Tried, Tested, Recommended"],
      description: "Comfortable hotel with free shuttle running every 30 minutes.",
      links: {
        choose: "/hotel/hilton-garden/choose",
      },
    },
  ],
};
