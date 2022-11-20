//Importing requirements.
const pg = require('pg');
require('dotenv').config();
const fetch = require('node-fetch');
const named = require('yesql').pg

//Basic setup (database connection and the url).
const PRODUCT_URL = "https://raw.githubusercontent.com/Exove/developer-test/main/material/products.json";
const pool = new pg.Pool({
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    host: process.env.PG_HOST,
    database: process.env.PG_DBNAME,
    port: 5432,
    max: 100
});

//Database handler, used for databse queries.
const sqlConnection = async(query, args) => {
    try {
        let result = [];
        const client = await pool.connect();
        result = await client.query(query, args);
        client.end();
        return result;
    } catch (e) { //If error occures:
        console.log("error");
        console.log(e);
    }
} 

//Creating tables for the first time running the program.
const createTables = async() => {
    //Product itself
    await sqlConnection("CREATE TABLE IF NOT EXISTS product (id SERIAL, original_id TEXT, PRIMARY KEY (id));");

    //Language-related options
    await sqlConnection("CREATE TABLE IF NOT EXISTS language (id SERIAL, language TEXT, PRIMARY KEY (id));");
    await sqlConnection("CREATE TABLE IF NOT EXISTS descriptions (id SERIAL, product_id INT REFERENCES product(id), language_id INT REFERENCES language(id), description TEXT, PRIMARY KEY (id));");
    await sqlConnection("CREATE TABLE IF NOT EXISTS names (id SERIAL, product_id INT REFERENCES product(id), language_id INT REFERENCES language(id), name TEXT, PRIMARY KEY (id));");
    
    //Categories
    await sqlConnection("CREATE TABLE IF NOT EXISTS categories (id SERIAL, original_id TEXT, PRIMARY KEY (id));"); 
    await sqlConnection("CREATE TABLE IF NOT EXISTS category_names (id SERIAL, category_id INT REFERENCES categories(id), language_id INT REFERENCES language(id), name TEXT, PRIMARY KEY (id));");
    await sqlConnection("CREATE TABLE IF NOT EXISTS product_categories (id SERIAL, product_id INT REFERENCES product(id), category_id INT REFERENCES categories(id), PRIMARY KEY (id));");

    //Variations
    await sqlConnection("CREATE TABLE IF NOT EXISTS variations (id SERIAL, product_id INT REFERENCES product(id), PRIMARY KEY (id));");

    //Prices
    await sqlConnection("CREATE TABLE IF NOT EXISTS currencies (id SERIAL, currency TEXT, PRIMARY KEY (id));");
    await sqlConnection("CREATE TABLE IF NOT EXISTS variation_prices (id SERIAL, variation_id INT REFERENCES variations(id), currency_id INT REFERENCES currencies(id), amount DECIMAL, PRIMARY KEY (id));");

    //Size
    await sqlConnection("CREATE TABLE IF NOT EXISTS sizes (id SERIAL, variation_id INT REFERENCES variations(id), size TEXT, PRIMARY KEY (id));");
    
    //Paper size
    await sqlConnection("CREATE TABLE IF NOT EXISTS paper_size (id SERIAL, variation_id INT REFERENCES variations(id), paper_size TEXT, PRIMARY KEY (id));");
}

//Made for checking language ids. If such language does not exist, returns 0.
const checkLanguageId = async(langauge) => {
    const res = await sqlConnection("SELECT id FROM language WHERE language = $1;", [langauge]);
    if (res.rows.length === 0) {
        return 0;
    } else {
        return res.rows[0].id;
    }
}

//Checking if wanted currency exists. If it does not, returns 0.
const checkCurrencyId = async(currency) => {
    const res = await sqlConnection("SELECT id FROM currencies WHERE currency = $1;", [currency]);
    if (res.rows.length === 0) {
        return 0;
    } else {
        return res.rows[0].id;
    }
}

//Creating default values. In this case, these are English as the language, and Euro as the currency.
const createDefaultValues = async() => {
    //Checking if English exists in the database. If not, it is added there.
    const englishId = await checkLanguageId("English"); 
    if (englishId === 0) {
        await sqlConnection("INSERT INTO language (language) VALUES ('English');");
    }

    //Checking if euro (default currency) has been added. If not, it is added to database.
    const eurRes = await checkCurrencyId("Euro");
    if (eurRes === 0) {
        await sqlConnection("INSERT INTO currencies (currency) VALUES ('Euro');");
    }

}

//Fetching products from the given link, and converting the data into JSON.
const getProducts = async() => {
    const loadedProducts = await fetch(PRODUCT_URL);
    const jsonProducts = await loadedProducts.json();
    const productList = jsonProducts.products;
    return productList;
}

//Category handing
const addingCategories = async (category, productId) => {
    const name = category.name;
    const originalId = category.id;
    let addedId = 0;

    //Checking category by its ID. If it does not exist, it will be created.
    const categoryQuery = await sqlConnection("SELECT * FROM categories WHERE original_id = $1;", [originalId]);

    //If category is not found, creating a new one. If it is found, using the found one's ID.
    if (categoryQuery.rows.length === 0) {
        await sqlConnection("INSERT INTO categories (original_id) VALUES ($1);", [originalId]);
        const newIdQuery = await sqlConnection("SELECT * FROM categories WHERE original_id = $1", [originalId]);
        addedId = newIdQuery.rows[0].id;
    } else {
        addedId = categoryQuery.rows[0].id;
    }

    //"Connecting the product ID and the category ID.
    await sqlConnection("INSERT INTO product_categories (product_id, category_id) VALUES ($1, $2);", [productId, addedId]);


    const englishId = await checkLanguageId("English");
    //Checking name. If it does not exist in the database, it will be created.
    const nameCheckingQuery = await sqlConnection("SELECT * FROM category_names WHERE category_id = $1 AND language_id = $2;", [addedId, englishId]);
    if (nameCheckingQuery.rows.length === 0) {
        await sqlConnection("INSERT INTO category_names (category_id, language_id, name) VALUES ($1, $2, $3);", [addedId, englishId, name]);
    }
}

//Adding different variations. The default variations are checked by the exercise given.
const addingVariations = async(variation, productId) => {
    const size = variation.size;
    const price = variation.price;
    const paperSize = variation['paper size'];

    //Adding a new variation ID and getting it.
    await sqlConnection("INSERT INTO variations (product_id) VALUES ($1);", [productId]);
    const newestVariationIdQuery = await sqlConnection("SELECT * FROM variations WHERE product_id = $1;", [productId]);
    const newestVariationId = newestVariationIdQuery.rows[0].id;    

    //Adding the price of the product.
    const defaultCurrencyId = await checkCurrencyId("Euro");
    await sqlConnection("INSERT INTO variation_prices (variation_id, currency_id, amount) VALUES ($1, $2, $3);", [newestVariationId, defaultCurrencyId, price]);

    //Checking if the item has variation "size". If it has, adding it to the database.
    if (!(typeof size === 'undefined')) {
        await sqlConnection("INSERT INTO sizes (variation_id, size) VALUES ($1, $2);", [newestVariationId, size]);
    }

    //Checking if the item has variation "paper_size" in it. If it has, adding it to the database.
    if (!(typeof paperSize === 'undefined')) {
        await sqlConnection("INSERT INTO paper_size (variation_id, paper_size) VALUES ($1, $2);", [newestVariationId, paperSize]);
    }
}

//Adding product to the database.
const insertBasicInfo = async(product) => {
    const id = product.id;
    let productId;

    //Checking if product exists in the database already. If it doesn't, adding a new product based on the information.
    const queryResults = await sqlConnection("SELECT * FROM product WHERE original_id = $1;", [id]);
    if (queryResults.rows.length === 0) {
        await sqlConnection("INSERT INTO product (original_id) VALUES ($1);", [product.id]);
        const gettingNewestId = await sqlConnection("SELECT id FROM product WHERE original_id = $1 ORDER BY id DESC;", [product.id]);
        productId = gettingNewestId.rows[0].id;
        const englishId = await checkLanguageId("English");
        await sqlConnection("INSERT INTO descriptions (product_id, language_id, description) VALUES ($1, $2, $3);", [productId, englishId, product.description]);
        await sqlConnection("INSERT INTO names (product_id, language_id, name) VALUES ($1, $2, $3);", [productId, englishId, product.name]);

        const queryForProductId = await sqlConnection("SELECT * FROM product WHERE original_id = $1;", [id]);
        productId = queryForProductId.rows[0].id;
    } else {
        productId = queryResults.rows[0].id;
    }
    
    //Checking product's categories.
    for (let i = 0; i < product.categories.length; i++) {
        await addingCategories(product.categories[i], productId);
    }

    //Checking product's variations.
    for (let i = 0; i < product.variations.length; i++) {
        await addingVariations(product.variations[i], productId);
    }
}

//Looping the list through and adding all the products.
const analyzeProducts = async(products) => {
    for (let i = 0; i < products.length; i++) {
        await insertBasicInfo(products[i]);
    }
}

//Main function.
try {
    (async () => {
        await createTables();
        await createDefaultValues();
        const list = await getProducts();
        await analyzeProducts(list);
    })();
} catch (e) {
    console.log("Error: ", e);
}