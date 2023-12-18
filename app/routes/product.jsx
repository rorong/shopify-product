// products.js

// ... (existing imports)

import { useEffect, useState } from 'react';
import { json } from '@remix-run/node';
import { useActionData, useNavigation } from '@remix-run/react';
import { Page, Layout, Text, Card, List, Link } from '@shopify/polaris';
import { authenticate } from '../shopify.server';

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  // Fetch the list of products from Shopify and pass it to the component
  const productList = await fetchProductList();

  return json({ productList });
};

export const action = async ({ request }) => {
  // Add any necessary logic for handling actions related to products
  return json({ message: 'Product action endpoint' });
};

export default function Products() {
  const nav = useNavigation();
  const actionData = useActionData();
  const isLoading = ['loading', 'submitting'].includes(nav.state) && nav.formMethod === 'POST';

  const productList = actionData?.productList || [];

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            <Text as="h2" variant="headingMd">
              Product List
            </Text>
            {isLoading && <Text>Loading products...</Text>}
            {!isLoading && (
              <List type="bullet">
                {productList.map((product) => (
                  <List.Item key={product.id}>
                    <Link url={`shopify:admin/products/${product.id}`} target="_blank" removeUnderline>
                      {product.title}
                    </Link>
                  </List.Item>
                ))}
              </List>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

async function fetchProductList() {
  try {
    // Call the GraphQL query to fetch the list of products
    const response = await fetch('/.remix/api/loader', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: '/products',
        method: 'GET',
      }),
    });

    const responseData = await response.json();

    // Extract the product list from the GraphQL response
    const productList = responseData.productList || [];

    return productList;
  } catch (error) {
    console.error('Error fetching product list:', error);
    return [];
  }
}
