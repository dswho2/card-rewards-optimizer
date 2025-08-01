# Card Rewards Optimizer
Credit Card Recommendation Web App – Project & Data Flow Outline

## Tech Stack
| Tool / Tech                  | Purpose                                                                 |
|------------------------------|-------------------------------------------------------------------------|
| **Next.js + TypeScript**     | Fullstack React framework with routing, SSR, and frontend UI           |
| **Tailwind CSS**             | Utility-first styling and responsive layout                            |
| **shadcn/ui**                | Accessible, styled UI components built on Tailwind CSS                 |
| **React Query (TanStack)**   | API data fetching and caching                                          |
| **Zod + React Hook Form**    | Form handling and schema validation                                    |
| **Flask / FastAPI**          | Lightweight backend API to process user input and recommendations      |
| **PostgreSQL**               | Persistent storage for user profiles and card data                     |
| **Supabase / Auth0**         | User authentication and session management                             |
| **OpenAI API**               | Semantic understanding of user input (e.g. purchase intent → category) |
| **Recharts / Visx**          | Visual coverage grid heatmap rendering                                 |
| **Playwright / Puppeteer** (Optional) | Scraping reward data from credit card aggregator sites        |
| **Docker** (Optional)        | Containerized backend + deployment support                             |
| **Vercel**                   | Frontend hosting (optimized for Next.js)                               |
| **Render / Railway**         | Backend + database hosting                                             |
## High-Level App Flow

1. **User signs up / logs in**
2. **User selects the credit cards they own**
3. **User inputs a description of a purchase**  
   e.g. "I’m booking a hotel in New York"
4. **System maps the input to a reward category**  
   e.g. "travel"
5. **System finds the user's card(s) with the best reward for that category**
6. **Returns recommendation with reasoning and caveats (if any)**
7. Show visual breakdown of their card coverage by category
8. Suggest new cards that fill category gaps

---

## Backend Data Flow

### 1. User Input
- Text: `"buy groceries at Trader Joe's"`

### 2. Category Mapping
- Preprocessed using:
  - Keyword rules (MVP)
  - or Semantic Embedding similarity
  - or LLM prompt classification
- Result: `"grocery"`

### 3. User’s Card List
- Pulled from user profile
- e.g. `["amex_blue_cash", "citi_custom_cash", "chase_freedom_flex"]`

### 4. Reward Lookup
- For each card:
  - Find matching reward rules for `"grocery"`
  - Evaluate:
    - reward rate (numeric)
    - units (`percent`, `points`)
    - cap? (`$500/month`, etc)
    - special conditions (e.g. portal only)

### 5. Scoring Logic
- Rank cards by:
  - Effective rate
  - Simplicity (e.g. no portal requirement)
  - Remaining cap (if tracked)
- Result: list of best cards, sorted

### 6. Response
- JSON response to frontend:
```json
{
  "category": "grocery",
  "recommendations": [
    {
      "cardName": "Amex Blue Cash Preferred",
      "rate": 6,
      "unit": "percent",
      "notes": "Valid at U.S. supermarkets, up to $6,000/year"
    },
    {
      "cardName": "Citi Custom Cash",
      "rate": 5,
      "unit": "percent",
      "notes": "Only your top monthly category (up to $500/month)"
    }
  ]
}
```

## Frontend Flow

### 1. Login Screen
- Auth system (Supabase/Auth0/etc)

### 2. Card Selection UI
- List of supported cards
- Toggle/select cards user owns

### 3. Purchase Input Form
- Freeform text input
- On submit → calls backend /recommend endpoint

### 4. Recommendation Display
- Shows:
    - Top recommended card
    - Reward rate
    - Conditions or caps
    - Secondary options
- Optional toggle for full breakdown

### 5. Visual Coverage
- Grid style interactive heat map
    - What categories are covered?
    - What rate is covered?
    - What categories are missing?
        - users can hover and click into to view the card info

#### Design
The heatmap is structured as a **grid**:

- **Rows**: Spending categories (e.g. Dining, Travel, Grocery, Gas, etc.)
- **Columns**: User-selected credit cards
- **Cells**: Reward rates (e.g. 1x, 3x, 5%) for each card-category pair
  - Color intensity scales with reward rate
  - Cells are interactive:
    - **Hover** → Tooltip with detailed reward info and restrictions
    - **Click** → Modal with full explanation or add new card

#### Visual Example

| Category ↓ \ Card → | Amex Gold | Freedom Flex | Citi Custom Cash |
|---------------------|-----------|---------------|------------------|
| Dining              | 🟥 4x      | 🟨 3x         | ⬜ 1x             |
| Grocery             | 🟧 4x      | ⬜ 1x         | 🟥 5x (cap: $500/mo) |
| Travel              | 🟨 3x      | 🟥 5x (Q3 only) | ⬜ 1x           |
| Gas                 | ⬜ 1x      | 🟥 5x (Q2 only) | 🟥 5x           |

- 🟥 = High reward (5x+)
- 🟧 = Medium (3–4x)
- 🟨 = Low (2–3x)
- ⬜ = Default / fallback (1x or less)

#### Implementation Notes
- Built using a responsive, interactive grid with dynamic color scaling
- Powered by user's selected credit card data and internal reward category mappings
- Optionally integrates with the recommendation engine to highlight best card per category

#### Extras
- Ability to click a category and see recommended new cards to fill coverage gaps
- Simulated reward earnings based on user's spend profile
- Export/share visual to compare card setups

### 6. Suggested Cards
- Based on missing categories + estimated spend

## Data Model Summary

### CreditCard
```
{
  id: "amex_blue_cash_preferred",
  name: "Amex Blue Cash Preferred",
  issuer: "Amex",
  annualFee: 95,
  rewards: [
    {
      categories: ["grocery"],
      rate: 6,
      unit: "percent",
      maxRewardedAmount: 6000,
      maxRewardedInterval: "year"
    },
    {
      categories: ["general"],
      rate: 1,
      unit: "percent",
      baseReward: true
    }
  ]
}
```

### UserProfile
```
{
  id: "user_123",
  email: "test@example.com",
  selectedCards: ["amex_blue_cash_preferred", "chase_freedom_flex"]
}
```





## Category Coverage Visualizer – Feature Roadmap

This table visualizes how well each credit card covers various spending categories, helping users quickly determine which card to use for a given purchase. Below is the ranked list of current and planned features for the visualizer.

---

### MVP Features (Core & High Priority)

1. **Highlight Best Reward per Category**
   - Visually emphasize the best card(s) for each category (e.g. bold, colored badge, 🥇).
   - Helps users immediately identify which card to use for any purchase type.

2. **Hover Interactions**
   - **Hover on card name**: dims other cards to focus attention.
   - **Hover on category**: highlights the full row to clarify reward options.

3. **Click to View Card Details**
   - Opens a modal or side panel with full information:
     - Reward structure
     - Issuer
     - Annual fees
     - Bonuses or caveats

4. **Category Coverage Summary**
   - Sidebar or tooltip summary showing:
     - Number of cards that cover each category
     - Highest reward available
     - Optionally: user’s current best card for that category

5. **Responsive Scroll + Sticky First Column**
   - Maintains visibility of category names during horizontal scrolling.
   - Critical for good UX when users have many cards.

---

### Nice-to-Have Features (Optional or Advanced)

6. **Filter Cards by Category**
   - Filter view to only show cards offering:
     - Specific reward thresholds (e.g. "≥3x Dining")
     - Specific categories (e.g. "Only show Transit rewards")

7. **Pin or Focus Mode**
   - Allow users to "pin" cards or categories they care about.
   - Useful for power users comparing a few key cards.

8. **Simulate Purchase Tool**
   - Input category + amount → highlight the best card(s) and show expected reward (e.g. "You’d earn $4.50 using this card").

9. **Suggest Cards to Fill Gaps**
   - Highlight categories with weak or no coverage.
   - Recommend new cards to fill reward gaps.

10. **Custom Color Themes / Accessibility Mode**
    - Support for heatmap color mode, high-contrast, or colorblind-friendly palettes.

11. **Time-Based Reward Visualization**
    - Support rotating categories or intro offers (e.g. 5% cash back on Gas in Q2).
    - Option to toggle time-based views with a calendar selector.

---
