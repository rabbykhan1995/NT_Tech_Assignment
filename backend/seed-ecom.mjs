import pg from "pg";

const pool = new pg.Pool({
  connectionString: "postgresql://admin:admin123@localhost:5432/inventory_db",
});

async function seed() {
  const client = await pool.connect();

  try {
    // Seed brands
    const brands = ["Samsung", "LG", "Sony", "Panasonic", "Philips", "Xiaomi", "Havells"];
    const brandMap = {};
    for (const name of brands) {
      const { rows } = await client.query(
        `INSERT INTO brands (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [name]
      );
      brandMap[name] = rows[0].id;
    }

    // Seed units
    const units = ["Piece", "Kg", "Liter", "Box", "Pack"];
    const unitMap = {};
    for (const name of units) {
      const { rows } = await client.query(
        `INSERT INTO units (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [name]
      );
      unitMap[name] = rows[0].id;
    }

    // Seed categories
    const categories = ["Kitchen Appliances", "Electronics", "Home Appliances", "Groceries", "Fashion"];
    const catMap = {};
    for (const name of categories) {
      const { rows } = await client.query(
        `INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [name]
      );
      catMap[name] = rows[0].id;
    }

    // Products with variants
    const products = [
      {
        name: "Samsung Rice Cooker 1.8L",
        slug: "samsung-rice-cooker-18l",
        description: "Automatic rice cooker with keep-warm function, 1.8 liter capacity.",
        short_description: "1.8L automatic rice cooker with keep-warm function.",
        brandID: brandMap["Samsung"],
        unitID: unitMap["Piece"],
        categoryID: catMap["Kitchen Appliances"],
        purchasePrice: 1500,
        salePrice: 2200,
        discountPrice: 1980,
        stock: 50,
        sku: "SAM-RC-001",
        variants: [
          { salePrice: 2200, discountPrice: 1980, stock: 30, attributes: [{ name: "Color", value: "White" }] },
          { salePrice: 2400, discountPrice: 2160, stock: 20, attributes: [{ name: "Color", value: "Black" }] },
        ],
      },
      {
        name: "LG 1.5 Ton Split Air Conditioner",
        slug: "lg-15-ton-split-ac",
        description: "Dual inverter compressor, 5-star energy rating, auto-clean.",
        short_description: "1.5 Ton dual inverter AC with 5-star rating.",
        brandID: brandMap["LG"],
        unitID: unitMap["Piece"],
        categoryID: catMap["Home Appliances"],
        purchasePrice: 35000,
        salePrice: 45000,
        discountPrice: 40500,
        stock: 15,
        sku: "LG-AC-001",
        variants: [
          { salePrice: 45000, discountPrice: 40500, stock: 10, attributes: [{ name: "Capacity", value: "1.5 Ton" }] },
          { salePrice: 55000, discountPrice: 49500, stock: 5, attributes: [{ name: "Capacity", value: "2 Ton" }] },
        ],
      },
      {
        name: "Sony WH-1000XM5 Headphones",
        slug: "sony-wh1000xm5-headphones",
        description: "Industry-leading noise cancellation, 30-hour battery life.",
        short_description: "Wireless noise-cancelling headphones.",
        brandID: brandMap["Sony"],
        unitID: unitMap["Piece"],
        categoryID: catMap["Electronics"],
        purchasePrice: 18000,
        salePrice: 25000,
        discountPrice: 22500,
        stock: 25,
        sku: "SONY-WH-001",
        variants: [
          { salePrice: 25000, discountPrice: 22500, stock: 15, attributes: [{ name: "Color", value: "Black" }] },
          { salePrice: 26000, discountPrice: 23400, stock: 10, attributes: [{ name: "Color", value: "Silver" }] },
        ],
      },
      {
        name: "Panasonic 43 Inch 4K Smart TV",
        slug: "panasonic-43-inch-4k-smart-tv",
        description: "4K Ultra HD, HDR10+, Dolby Atmos, WebOS smart platform.",
        short_description: "43 inch 4K Smart TV with Dolby Atmos.",
        brandID: brandMap["Panasonic"],
        unitID: unitMap["Piece"],
        categoryID: catMap["Electronics"],
        purchasePrice: 28000,
        salePrice: 36000,
        discountPrice: 32400,
        stock: 10,
        sku: "PAN-TV-001",
        variants: [
          { salePrice: 36000, discountPrice: 32400, stock: 5, attributes: [{ name: "Size", value: "43 inch" }] },
          { salePrice: 48000, discountPrice: 43200, stock: 5, attributes: [{ name: "Size", value: "55 inch" }] },
        ],
      },
      {
        name: "Philips Air Fryer XXL",
        slug: "philips-air-fryer-xxl",
        description: "Fat-free frying with rapid air technology, 7.3L capacity.",
        short_description: "7.3L digital air fryer with rapid air technology.",
        brandID: brandMap["Philips"],
        unitID: unitMap["Piece"],
        categoryID: catMap["Kitchen Appliances"],
        purchasePrice: 8000,
        salePrice: 12000,
        discountPrice: 10800,
        stock: 30,
        sku: "PHI-AF-001",
        variants: [
          { salePrice: 12000, discountPrice: 10800, stock: 20, attributes: [{ name: "Color", value: "Black" }] },
          { salePrice: 13000, discountPrice: 11700, stock: 10, attributes: [{ name: "Color", value: "White" }] },
        ],
      },
      {
        name: "Xiaomi Mi 11 Ultra",
        slug: "xiaomi-mi-11-ultra",
        description: "Snapdragon 888, 12GB RAM, 256GB storage, 50MP triple camera.",
        short_description: "Flagship smartphone with 50MP camera.",
        brandID: brandMap["Xiaomi"],
        unitID: unitMap["Piece"],
        categoryID: catMap["Electronics"],
        purchasePrice: 50000,
        salePrice: 65000,
        discountPrice: 58500,
        stock: 20,
        sku: "XIAO-11U-001",
        variants: [
          { salePrice: 65000, discountPrice: 58500, stock: 10, attributes: [{ name: "Color", value: "Black" }] },
          { salePrice: 66000, discountPrice: 59400, stock: 10, attributes: [{ name: "Color", value: "White" }] },
        ],
      },
      {
        name: "Havells Ceiling Fan 1200mm",
        slug: "havells-ceiling-fan-1200mm",
        description: "High-speed 1200mm ceiling fan, energy efficient motor.",
        short_description: "1200mm ceiling fan with energy efficient motor.",
        brandID: brandMap["Havells"],
        unitID: unitMap["Piece"],
        categoryID: catMap["Home Appliances"],
        purchasePrice: 1200,
        salePrice: 2000,
        discountPrice: 1800,
        stock: 100,
        sku: "HAV-FAN-001",
        variants: [
          { salePrice: 2000, discountPrice: 1800, stock: 50, attributes: [{ name: "Color", value: "Brown" }] },
          { salePrice: 2200, discountPrice: 1980, stock: 30, attributes: [{ name: "Color", value: "White" }] },
        ],
      },
      {
        name: "Samsung 500L Side-by-Side Refrigerator",
        slug: "samsung-500l-side-by-side-fridge",
        description: "500L capacity, digital inverter compressor, twin cooling.",
        short_description: "500L side-by-side refrigerator with inverter compressor.",
        brandID: brandMap["Samsung"],
        unitID: unitMap["Piece"],
        categoryID: catMap["Home Appliances"],
        purchasePrice: 55000,
        salePrice: 72000,
        discountPrice: 64800,
        stock: 8,
        sku: "SAM-FRIDGE-001",
        variants: [
          { salePrice: 72000, discountPrice: 64800, stock: 5, attributes: [{ name: "Finish", value: "Stainless Steel" }] },
          { salePrice: 70000, discountPrice: 63000, stock: 3, attributes: [{ name: "Finish", value: "Black" }] },
        ],
      },
      {
        name: "LG 10.5Kg Front Load Washing Machine",
        slug: "lg-105kg-front-load-washing-machine",
        description: "AI Direct Drive, 6 Motion, TurboWash, Steam, Wi-Fi.",
        short_description: "10.5Kg front load washing machine with AI DD.",
        brandID: brandMap["LG"],
        unitID: unitMap["Piece"],
        categoryID: catMap["Home Appliances"],
        purchasePrice: 32000,
        salePrice: 42000,
        discountPrice: 37800,
        stock: 12,
        sku: "LG-WM-001",
        variants: [
          { salePrice: 42000, discountPrice: 37800, stock: 7, attributes: [{ name: "Color", value: "White" }] },
          { salePrice: 44000, discountPrice: 39600, stock: 5, attributes: [{ name: "Color", value: "Silver" }] },
        ],
      },
      {
        name: "Sony PlayStation 5",
        slug: "sony-playstation-5",
        description: "4K gaming console with DualSense controller, 825GB SSD.",
        short_description: "Next-gen gaming console with DualSense controller.",
        brandID: brandMap["Sony"],
        unitID: unitMap["Piece"],
        categoryID: catMap["Electronics"],
        purchasePrice: 40000,
        salePrice: 55000,
        discountPrice: 49500,
        stock: 5,
        sku: "SONY-PS5-001",
        variants: [
          { salePrice: 55000, discountPrice: 49500, stock: 3, attributes: [{ name: "Edition", value: "Standard" }] },
          { salePrice: 65000, discountPrice: 58500, stock: 2, attributes: [{ name: "Edition", value: "Digital" }] },
        ],
      },
    ];

    let insertedCount = 0;
    for (const p of products) {
      // Check if product already exists by slug
      const { rows: existing } = await client.query(
        `SELECT id FROM products WHERE slug = $1`,
        [p.slug]
      );
      if (existing.length > 0) {
        console.log(`Skipping (exists): ${p.name}`);
        continue;
      }

      // Insert product
      const { rows: prodRows } = await client.query(
        `INSERT INTO products (
          name, slug, description, short_description,
          brand_id, unit_id, category_id,
          purchase_price, sale_price, discount_price, stock,
          sku, is_published, in_pos_list, featured,
          status, total_sold, average_rating, total_reviews,
          show_stock, sort_order
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7,
          $8, $9, $10, $11,
          $12, true, true, true,
          'active', floor(random() * 50 + 10)::numeric, floor(random() * 5 * 10)::numeric / 10, floor(random() * 100 + 10)::int,
          true, 0
        ) RETURNING id`,
        [
          p.name, p.slug, p.description, p.short_description,
          p.brandID, p.unitID, p.categoryID,
          p.purchasePrice, p.salePrice, p.discountPrice, p.stock,
          p.sku,
        ]
      );
      const productID = prodRows[0].id;

      // Insert variants
      for (const v of p.variants) {
        await client.query(
          `INSERT INTO variants (
            product_id, sale_price, discount_price, stock, attributes
          ) VALUES ($1, $2, $3, $4, $5::jsonb)`,
          [
            productID,
            v.salePrice,
            v.discountPrice,
            v.stock,
            JSON.stringify(v.attributes),
          ]
        );
      }
      insertedCount++;
      console.log(`Inserted: ${p.name}`);
    }

    console.log(`\nDone. Inserted ${insertedCount} new products.`);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
