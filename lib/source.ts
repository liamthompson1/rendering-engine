// The hotels.md source — Stage 0 of the pipeline.
// This is exactly what an author (or LLM) would write.
export const SOURCE_MD = `---
title: Hotels at Manchester Airport
data: data/hotels.json
---

# Hotels at Manchester Airport

{{#each products}}
:::group{role=card id="{{id}}"}
:::image{src="{{logoUrl}}" alt="{{name}}"}:::

## {{name}}

{{#if highlight}}
:::status{tone=positive}{{highlight}}:::
{{/if}}

{{location}} · ★ {{stars}} · {{rating}}/10

:::price{value="{{price}}" currency=GBP label="Hotel packages from"}:::

:::list{layout=inline}
{{#each badges}}- {{this}}
{{/each}}
:::

{{description}}

{{#if packageCount}}
:::action{href="{{links.packages}}" variant=primary}Show Packages ({{packageCount}}):::
{{else}}
:::action{href="{{links.choose}}" variant=primary}Choose:::
{{/if}}
:::
{{/each}}
`;

// data/hotels.json — Stage 1 (faked).
// Two products, deliberately exercising both branches of every conditional.
export const DATA_JSON = {
  products: [
    {
      id: "crowne-plaza-t1",
      name: "Crowne Plaza Manchester Airport T1",
      stars: 4,
      logoUrl: "/images/crowne-plaza-t1.jpg",
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
      logoUrl: "/images/hilton-garden.jpg",
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
