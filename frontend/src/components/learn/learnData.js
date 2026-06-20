// =============================================================================
// SECTION: Learn page static content
// Articles, videos, glossary terms, and myth/fact pairs. Pure data, no JSX —
// extracted from LearnPage.jsx so the page module stays small.
// NOTE: strings use double quotes so internal apostrophes never break parsing.
// =============================================================================

export const ARTICLES = [
  { id: 1, cat: 'Energy',    title: "Why your electricity's carbon intensity changes every hour",   read: '5 min', date: 'May 28', emoji: '⚡' },
  { id: 2, cat: 'Diet',      title: "The real carbon cost of a beef burger vs. a plant burger",    read: '4 min', date: 'May 20', emoji: '🍔' },
  { id: 3, cat: 'Transport', title: "Electric cars: how green are they really?",                   read: '6 min', date: 'May 15', emoji: '🚗' },
  { id: 4, cat: 'Shopping',  title: "Fast fashion's hidden climate footprint",                     read: '3 min', date: 'May 10', emoji: '👕' },
  { id: 5, cat: 'Science',   title: "Understanding CO2 equivalents and why they matter",           read: '7 min', date: 'May 5',  emoji: '🔬' },
  { id: 6, cat: 'Policy',    title: "Carbon offsets: do they actually work?",                      read: '8 min', date: 'Apr 28', emoji: '📋' },
  { id: 7, cat: 'Energy',    title: "How to cut your home heating bill and your carbon footprint", read: '5 min', date: 'Apr 22', emoji: '🏠' },
  { id: 8, cat: 'Diet',      title: "A guide to low-carbon eating on a budget",                   read: '4 min', date: 'Apr 18', emoji: '🥦' },
  { id: 9, cat: 'Transport', title: "Is flying really that bad? The numbers explained",           read: '6 min', date: 'Apr 10', emoji: '✈️' },
];

export const VIDEOS = [
  { id: 1, title: "How does the carbon cycle work?",        channel: 'TED-Ed',           duration: '4:32', emoji: '🌍' },
  { id: 2, title: "The true cost of your food",            channel: 'Kurzgesagt',        duration: '9:14', emoji: '🥩' },
  { id: 3, title: "Can renewable energy power the world?", channel: 'Our World in Data', duration: '7:05', emoji: '☀️' },
  { id: 4, title: "Why your commute matters for climate",  channel: 'CarbonTrace',       duration: '3:22', emoji: '🚌' },
  { id: 5, title: "Net zero: what does it actually mean?", channel: 'BBC Science',       duration: '5:48', emoji: '🌿' },
  { id: 6, title: "Ocean carbon sinks explained",          channel: 'NOAA',              duration: '6:11', emoji: '🌊' },
];

export const GLOSSARY_TERMS = [
  { term: 'Carbon Footprint', def: "The total amount of greenhouse gases produced to support human activities, expressed in equivalent tons of CO2.",           related: ['CO2 Equivalent', 'Scope 1'] },
  { term: 'CO2 Equivalent',   def: "A metric used to compare emissions from various greenhouse gases based on their global warming potential relative to CO2.", related: ['Carbon Footprint'] },
  { term: 'Emission Factor',  def: "A coefficient that relates the quantity of a pollutant released to the unit of activity associated with the release.",      related: ['Scope 1', 'Scope 2'] },
  { term: 'IPCC',             def: "Intergovernmental Panel on Climate Change — the UN body for assessing the science related to climate change.",               related: ['Net Zero'] },
  { term: 'Net Zero',         def: "Achieving a balance between the greenhouse gases emitted into the atmosphere and those removed from it.",                    related: ['Carbon Offset', 'IPCC'] },
  { term: 'Carbon Credit',    def: "A permit allowing the holder to emit one tonne of CO2 or equivalent greenhouse gas.",                                       related: ['Carbon Offset'] },
  { term: 'Carbon Offset',    def: "A reduction in emissions of CO2 made to compensate for an emission made elsewhere.",                                        related: ['Carbon Credit', 'Net Zero'] },
  { term: 'Scope 1',          def: "Direct greenhouse gas emissions from sources controlled or owned by an organisation.",                                      related: ['Scope 2', 'Scope 3'] },
  { term: 'Scope 2',          def: "Indirect emissions from the generation of purchased electricity, heat, or steam.",                                          related: ['Scope 1', 'Scope 3'] },
  { term: 'Scope 3',          def: "All other indirect emissions that occur in a company's value chain, including end use by consumers.",                        related: ['Scope 1', 'Scope 2'] },
];

export const MYTHS = [
  { myth: "Recycling is the most impactful climate action I can take.", fact: "Transport and diet have 10-50x more impact than recycling for most people. Recycling matters but it's not the top lever.", source: "IPCC AR6, 2021" },
  { myth: "Electric cars have a bigger carbon footprint than petrol cars due to battery production.", fact: "Over its lifetime, an EV emits 50-70% less CO2 than a petrol car, even accounting for battery manufacturing.", source: "IEA, Global EV Outlook 2023" },
  { myth: "Individual actions don't matter — only corporations can fix climate change.", fact: "Household consumption drives ~72% of global emissions. Individual choices aggregate into massive demand-side change.", source: "CDP, 2024" },
  { myth: "Going vegetarian doesn't really help if I fly once a year.", fact: "Both matter. A single transatlantic flight is roughly 1.5-3 tonnes CO2. Giving up beef for a year saves roughly 0.5-1 tonne. They compound.", source: "BBC Climate Calculator, 2023" },
  { myth: "Carbon offsets neutralise my flights completely.", fact: "Most offset projects are difficult to verify and may not permanently remove carbon. Reduction is always preferable to offsetting.", source: "Science Based Targets initiative, 2023" },
  { myth: "Local food is always lower carbon than imported food.", fact: "Transport accounts for less than 10% of most food's carbon footprint. What you eat matters far more than where it's from.", source: "Our World in Data, 2020" },
];

export const CAT_COLORS = {
  Energy: 'green', Diet: 'amber', Transport: 'default', Shopping: 'red', Science: 'default', Policy: 'default',
};

export const LEARN_TABS = [
  { id: 'articles', label: 'Articles',     icon: 'article'       },
  { id: 'videos',   label: 'Videos',       icon: 'play_circle'   },
  { id: 'glossary', label: 'Glossary',     icon: 'menu_book'     },
  { id: 'myths',    label: 'Myth vs Fact', icon: 'question_mark' },
];
