// Category mappings for enhanced keyword-based categorization
// This provides comprehensive keyword coverage before falling back to OpenAI

const CATEGORY_KEYWORDS = {
  'Travel': [
    // Hotels & Accommodation
    'hotel', 'motel', 'inn', 'resort', 'lodge', 'hostel', 'airbnb', 'vrbo', 'booking', 'expedia',
    'marriott', 'hilton', 'hyatt', 'intercontinental', 'sheraton', 'westin', 'ritz carlton',
    'holiday inn', 'best western', 'doubletree', 'courtyard', 'residence inn',
    
    // Airlines & Flights
    'flight', 'airline', 'airport', 'plane', 'aviation', 'airways', 'air',
    'delta', 'united', 'american airlines', 'southwest', 'jetblue', 'alaska airlines',
    'frontier', 'spirit', 'lufthansa', 'british airways', 'emirates', 'qatar',
    
    // Transportation
    'uber', 'lyft', 'taxi', 'cab', 'rideshare', 'rental car', 'car rental',
    'hertz', 'enterprise', 'avis', 'budget', 'national', 'alamo', 'thrifty',
    'train', 'amtrak', 'subway', 'metro', 'bus', 'greyhound', 'megabus',
    
    // Travel-related
    'cruise', 'vacation', 'trip', 'travel', 'touring', 'sightseeing',
    'travel insurance', 'visa fees', 'passport', 'tsa precheck', 'global entry'
  ],

  'Dining': [
    // General dining
    'restaurant', 'dining', 'food', 'eat', 'meal', 'lunch', 'dinner', 'breakfast', 'brunch',
    'cafe', 'coffee shop', 'bistro', 'diner', 'steakhouse', 'pizzeria', 'bakery',
    'bar', 'pub', 'tavern', 'brewery', 'winery', 'cocktail', 'lounge',
    
    // Delivery & Takeout
    'takeout', 'delivery', 'to-go', 'pickup', 'drive-thru', 'drive through',
    'doordash', 'ubereats', 'grubhub', 'postmates', 'seamless', 'deliveroo',
    
    // Popular chains
    'mcdonald', 'burger king', 'wendy', 'taco bell', 'kfc', 'subway', 'chipotle',
    'panera', 'starbucks', 'dunkin', 'domino', 'pizza hut', 'papa john',
    'olive garden', 'applebee', 'chili', 'outback', 'red lobster', 'tgif',
    
    // Coffee & Beverages
    'coffee', 'latte', 'cappuccino', 'espresso', 'tea', 'smoothie', 'juice',
    'starbucks', 'dunkin donuts', 'peet', 'caribou coffee', 'tim hortons'
  ],

  'Grocery': [
    // General grocery terms
    'grocery', 'groceries', 'supermarket', 'food shopping', 'food store',
    'market', 'food mart', 'fresh market', 'organic market',
    
    // Major chains
    'whole foods', 'trader joe', 'safeway', 'kroger', 'publix', 'wegmans',
    'harris teeter', 'food lion', 'giant', 'stop shop', 'king soopers',
    'fred meyer', 'qfc', 'ralphs', 'vons', 'albertsons', 'meijer',
    
    // Wholesale clubs
    'costco', 'sam club', 'bj wholesale', 'warehouse club', 'bulk shopping',
    
    // Discount stores with groceries
    'walmart', 'target', 'aldi', 'lidl', 'food 4 less', 'winco',
    
    // Specialty food stores
    'butcher', 'deli', 'farmers market', 'fish market', 'meat market',
    'health food', 'natural food', 'vitamin', 'supplement'
  ],

  'Gas': [
    // General fuel terms
    'gas', 'gasoline', 'fuel', 'petrol', 'diesel', 'gas station', 'fuel station',
    'service station', 'filling station', 'pump', 'fill up', 'tank', 'fuel tank',
    
    // Major gas station brands
    'shell', 'exxon', 'mobil', 'chevron', 'bp', 'texaco', 'citgo', 'sunoco',
    'marathon', 'speedway', 'phillips 66', 'conoco', 'valero', 'arco',
    'wawa', 'sheetz', 'casey', 'kwik trip', 'quiktrip', 'racetrac',
    '7-eleven', 'circle k', 'pilot', 'loves', 'flying j', 'ta travel centers',
    
    // Electric vehicle charging
    'tesla supercharger', 'ev charging', 'electric vehicle', 'chargepoint',
    'electrify america', 'evgo'
  ],

  'Entertainment': [
    // Movies & Theater
    'movie', 'cinema', 'theater', 'theatre', 'film', 'show', 'performance',
    'amc', 'regal', 'cinemark', 'imax', 'broadway', 'concert hall',
    
    // Streaming services
    'netflix', 'hulu', 'disney+', 'amazon prime', 'hbo max', 'apple tv',
    'paramount+', 'peacock', 'discovery+', 'espn+', 'showtime', 'starz',
    'youtube premium', 'spotify', 'apple music', 'pandora', 'tidal',
    
    // Events & Activities
    'concert', 'festival', 'sporting event', 'game', 'tickets', 'ticketmaster',
    'stubhub', 'vivid seats', 'seatgeek', 'event', 'show', 'performance',
    'amusement park', 'theme park', 'zoo', 'museum', 'aquarium',
    'disney world', 'disneyland', 'universal studios', 'six flags',
    
    // Gaming
    'xbox', 'playstation', 'nintendo', 'steam', 'epic games', 'gaming',
    'video game', 'game store', 'gamestop'
  ],

  'Online': [
    // Major e-commerce
    'amazon', 'ebay', 'walmart.com', 'target.com', 'bestbuy.com',
    'online shopping', 'e-commerce', 'internet purchase', 'web store',
    'online order', 'digital purchase', 'online marketplace',
    
    // App stores & digital content
    'apple store', 'app store', 'google play', 'microsoft store',
    'steam', 'epic games', 'digital download', 'software purchase',
    
    // Payment processors
    'paypal', 'square', 'stripe', 'venmo', 'cashapp', 'zelle',
    
    // Online services
    'subscription', 'online service', 'web hosting', 'domain', 'saas',
    'cloud storage', 'dropbox', 'google drive', 'icloud'
  ],

  'Transit': [
    // Public transportation
    'metro', 'subway', 'bus', 'train', 'light rail', 'streetcar', 'trolley',
    'public transport', 'public transportation', 'transit', 'commuter rail',
    'bart', 'metro card', 'transit card', 'tap card', 'charlie card',
    'subway fare', 'bus fare', 'train fare', 'metro fare', 'transit fare',
    
    // Specific transit systems
    'mta', 'wmata', 'cta', 'septa', 'mbta', 'trimet', 'muni',
    
    // Parking & tolls
    'parking', 'parking meter', 'parking garage', 'valet', 'toll',
    'toll road', 'toll bridge', 'ezpass', 'fastrak', 'sunpass',
    
    // Ride sharing (business/transit focused)
    'uber pool', 'lyft shared', 'public ride', 'shuttle',
    
    // Bike & scooter sharing
    'bike share', 'citibike', 'lime scooter', 'bird scooter', 'spin'
  ],

  'Healthcare': [
    'doctor', 'hospital', 'clinic', 'pharmacy', 'medical', 'dentist',
    'dental', 'vision', 'optometry', 'prescription', 'medication',
    'cvs', 'walgreens', 'rite aid', 'urgent care', 'emergency room'
  ],

  'Insurance': [
    'insurance', 'premium', 'policy', 'coverage', 'auto insurance',
    'car insurance', 'home insurance', 'health insurance', 'life insurance',
    'renters insurance', 'umbrella policy'
  ],

  'Utilities': [
    'electric', 'electricity', 'gas bill', 'water', 'sewer', 'trash',
    'internet', 'cable', 'phone', 'wireless', 'cell phone', 'mobile',
    'verizon', 'att', 'tmobile', 'sprint', 'comcast', 'spectrum', 'cox'
  ]
};

// Merchant patterns that provide high-confidence categorization
const MERCHANT_PATTERNS = {
  // Travel
  'MARRIOTT': 'Travel',
  'HILTON': 'Travel',
  'HYATT': 'Travel',
  'SHERATON': 'Travel',
  'WESTIN': 'Travel',
  'DELTA AIR': 'Travel',
  'UNITED AIR': 'Travel',
  'AMERICAN AIR': 'Travel',
  'SOUTHWEST': 'Travel',
  'UBER': 'Travel',
  'LYFT': 'Travel',
  'HERTZ': 'Travel',
  'ENTERPRISE': 'Travel',
  'AVIS': 'Travel',
  'AIRBNB': 'Travel',
  'BOOKING.COM': 'Travel',
  'EXPEDIA': 'Travel',

  // Dining
  'MCDONALD': 'Dining',
  'STARBUCKS': 'Dining',
  'SUBWAY': 'Dining',
  'CHIPOTLE': 'Dining',
  'DOMINO': 'Dining',
  'PIZZA HUT': 'Dining',
  'TACO BELL': 'Dining',
  'KFC': 'Dining',
  'BURGER KING': 'Dining',
  'WENDY': 'Dining',
  'DOORDASH': 'Dining',
  'UBEREATS': 'Dining',
  'GRUBHUB': 'Dining',

  // Grocery
  'WHOLE FOODS': 'Grocery',
  'TRADER JOE': 'Grocery',
  'SAFEWAY': 'Grocery',
  'KROGER': 'Grocery',
  'PUBLIX': 'Grocery',
  'COSTCO': 'Grocery',
  'SAM\'S CLUB': 'Grocery',
  'WALMART': 'Grocery',
  'TARGET': 'Grocery',
  'ALDI': 'Grocery',

  // Gas
  'SHELL': 'Gas',
  'EXXON': 'Gas',
  'MOBIL': 'Gas',
  'CHEVRON': 'Gas',
  'BP': 'Gas',
  'TEXACO': 'Gas',
  'CITGO': 'Gas',
  'SUNOCO': 'Gas',
  'MARATHON': 'Gas',
  'SPEEDWAY': 'Gas',

  // Online
  'AMZN': 'Online',
  'AMAZON': 'Online',
  'EBAY': 'Online',
  'PAYPAL': 'Online',
  'APPLE.COM': 'Online',
  'GOOGLE': 'Online',

  // Entertainment
  'NETFLIX': 'Entertainment',
  'HULU': 'Entertainment',
  'DISNEY+': 'Entertainment',
  'SPOTIFY': 'Entertainment',
  'AMC': 'Entertainment',
  'REGAL': 'Entertainment',

  // Transit
  'MTA': 'Transit',
  'BART': 'Transit',
  'METRO': 'Transit',
  'PARKING': 'Transit'
};

// Category priorities for conflicting matches
const CATEGORY_PRIORITY = {
  'Travel': 10,
  'Dining': 9,
  'Gas': 8,
  'Grocery': 7,
  'Entertainment': 6,
  'Online': 5,
  'Transit': 4,
  'Healthcare': 3,
  'Insurance': 2,
  'Utilities': 1
};

module.exports = {
  CATEGORY_KEYWORDS,
  MERCHANT_PATTERNS,
  CATEGORY_PRIORITY
};