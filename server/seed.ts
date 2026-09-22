import { PRODUCTS } from "../lib/products.js";
import { connectDatabase, disconnectDatabase } from "./src/config/database.js";
import { Category } from "./src/models/Category.js";
import { Product } from "./src/models/Product.js";
import { slugify } from "./src/utils/slug.js";
import { logger } from "./src/utils/logger.js";

async function seed(): Promise<void> {
  await connectDatabase();

  const categoryNames = [...new Set(PRODUCTS.map((product) => product.category))];
  const categories = new Map<string, string>();
  for (const name of categoryNames) {
    const category = await Category.findOneAndUpdate(
      { slug: slugify(name) },
      { $set: { name, slug: slugify(name), description: `${name} archive goods` } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    categories.set(name, category.id);
  }

  for (const item of PRODUCTS) {
    await Product.findOneAndUpdate(
      { ref: item.ref },
      {
        $set: {
          name: item.name,
          slug: slugify(item.name),
          ref: item.ref,
          description: item.note,
          note: item.note,
          category: categories.get(item.category),
          price: item.price,
          images: [{ url: item.image, alt: item.name }],
          stock: 20,
          isPublished: true,
          featured: item.id === "01",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  logger.info({ products: PRODUCTS.length, categories: categoryNames.length }, "Catalogue seeded successfully");
  await disconnectDatabase();
}

seed().catch(async (error) => {
  logger.error({ err: error }, "Catalogue seeding failed");
  await disconnectDatabase();
  process.exit(1);
});
