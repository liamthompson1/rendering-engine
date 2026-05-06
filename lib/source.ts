// The natural-language prompt the AI received before producing the markdown.
// Played as a typewriter animation in Stage 0 of the walkthrough.
export const AI_PROMPT = `Build me a Hotels at Manchester Airport listing page for Holiday Extras.

Two hotels:
- Crowne Plaza T1 — 4-star, £129, "Walk to T1 in 5 minutes" highlight, badges for Free Cancellation and Never Beaten on Price, with 4 packages.
- Hilton Garden Inn — 4-star, £108.50, 10 minutes by shuttle, Tried Tested Recommended badge, no live packages so the CTA is "Choose".

Use the rendering engine dialect.`;

// The hotels.md source — Stage 1 of the pipeline.
// Uses remark-directive syntax:
//   ::name{attrs}              — leaf directive (no body)
//   :::name{attrs} … :::       — container directive (with body)
export const SOURCE_MD = `---
title: Hotels at Manchester Airport
data: data/hotels.json
---

# Hotels at Manchester Airport

{{#each products}}
::::group{role=card id="{{id}}"}
::image{src="{{logoUrl}}" alt="{{name}}"}

## {{name}}

{{#if highlight}}
:::status{tone=positive}
{{highlight}}
:::
{{/if}}

{{location}} · ★ {{stars}} · {{rating}}/10

::price{value="{{price}}" currency=GBP label="Hotel packages from"}

:::list{layout=inline}
{{#each badges}}- {{this}}
{{/each}}
:::

{{description}}

{{#if packageCount}}
:::action{href="{{links.packages}}" variant=primary}
Show Packages ({{packageCount}})
:::
{{else}}
:::action{href="{{links.choose}}" variant=primary}
Choose
:::
{{/if}}
::::
{{/each}}
`;

// data/hotels.json — Stage 1 (faked).
// Two products, deliberately different so both {{#if}} branches fire.
// logoUrl uses picsum.photos with a stable seed per hotel so each card
// gets a consistent, real image without bundling assets.
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
