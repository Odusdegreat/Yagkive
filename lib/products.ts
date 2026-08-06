export type Category = "Outerwear" | "Bottoms" | "Accessories" | "Footwear";

export type Filter = "All" | Category;

export type ProductIconType = "jacket" | "vest" | "trouser" | "cap" | "tote" | "boot";

export interface Product {
  id: string;
  ref: string;
  name: string;
  category: Category;
  price: number;
  note: string;
  icon: ProductIconType;
  image: string;
}

export interface CartItem extends Product {
  qty: number;
}

export const CATEGORIES: Filter[] = ["All", "Outerwear", "Bottoms", "Accessories", "Footwear"];

export const PRODUCTS: Product[] = [
  {
    id: "01",
    ref: "REF.014-A",
    name: "M-51 Field Jacket",
    category: "Outerwear",
    price: 228,
    note: "Cotton twill, welded seams",
    icon: "jacket",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "02",
    ref: "REF.014-C",
    name: "Utility Vest, Sateen",
    category: "Outerwear",
    price: 164,
    note: "6-pocket, brass hardware",
    icon: "vest",
    image: "https://images.unsplash.com/photo-1637579103895-9ba8218e9aca?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "03",
    ref: "REF.022-B",
    name: "6-Pocket Cargo Trouser",
    category: "Bottoms",
    price: 156,
    note: "Ripstop nylon blend",
    icon: "trouser",
    image: "https://images.unsplash.com/photo-1511794322962-129ddbd0af38?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "04",
    ref: "REF.031-A",
    name: "Wool Watch Cap",
    category: "Accessories",
    price: 48,
    note: "Merino, double-cuff",
    icon: "cap",
    image: "https://images.unsplash.com/photo-1618354691792-d1d42acfd860?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "05",
    ref: "REF.033-D",
    name: "Canvas Deployment Tote",
    category: "Accessories",
    price: 96,
    note: "18oz canvas, leather base",
    icon: "tote",
    image: "https://images.unsplash.com/photo-1535981444082-2a5dc0548ef3?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "06",
    ref: "REF.041-A",
    name: "Derby Boot, Leather",
    category: "Footwear",
    price: 284,
    note: "Full-grain, welted sole",
    icon: "boot",
    image: "https://images.unsplash.com/photo-1605812860427-4024433a70fd?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "07",
    ref: "REF.015-B",
    name: "Hooded Field Parka",
    category: "Outerwear",
    price: 248,
    note: "3-layer shell, storm flap",
    icon: "jacket",
    image: "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "08",
    ref: "REF.016-C",
    name: "Wool Overshirt",
    category: "Outerwear",
    price: 132,
    note: "Suffolk flannel, boxed placket",
    icon: "jacket",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "09",
    ref: "REF.024-A",
    name: "5-Pocket Selvedge Jean",
    category: "Bottoms",
    price: 148,
    note: "14oz selvedge, hidden rivets",
    icon: "trouser",
    image: "https://images.unsplash.com/photo-1517438476312-10d79c077509?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "10",
    ref: "REF.026-D",
    name: "Ripstop Utility Short",
    category: "Bottoms",
    price: 86,
    note: "Nylon ripstop, articulated",
    icon: "trouser",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "11",
    ref: "REF.034-B",
    name: "Nylon Bucket Hat",
    category: "Accessories",
    price: 42,
    note: "Tape-sealed, adjustable",
    icon: "cap",
    image: "https://images.unsplash.com/photo-1521369909029-2afed882baee?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "12",
    ref: "REF.036-A",
    name: "Weekender Duffle",
    category: "Accessories",
    price: 150,
    note: "Waxed canvas, webbing straps",
    icon: "tote",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "13",
    ref: "REF.044-B",
    name: "Combat Boot, Suede",
    category: "Footwear",
    price: 212,
    note: "Suede upper, lug sole",
    icon: "boot",
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "14",
    ref: "REF.046-C",
    name: "Trail Sandal",
    category: "Footwear",
    price: 96,
    note: "Webbing straps, moulded footbed",
    icon: "boot",
    image: "https://images.unsplash.com/photo-1560343090-f0409e92791a?q=80&w=800&auto=format&fit=crop",
  },
];
