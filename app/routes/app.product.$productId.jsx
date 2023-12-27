// routes/product/[productId].js
import { authenticate } from '../shopify.server';
import { json } from "@remix-run/node";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  List,
} from "@shopify/polaris";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { extractProductId } from './utils';

export const loader = async ({ params, request }) => {
  const productId = params.productId;

  try {
    // Authenticate with Shopify admin
    const { admin } = await authenticate.admin(request);
    // Make GraphQL query to fetch product details
    const response = await admin.graphql(
      `#graphql
      query {
        product(id: "gid://shopify/Product/${productId}") {
          id
          title
          description
          onlineStoreUrl
        }
      }`,
    );
    // Parse and return the product details
    const productDetail = await response.json();
    return productDetail;
  } catch (error) {
    console.error('Error fetching product details:', error);
    return json({ error: 'Failed to fetch product details.' }, 500);
  }
};

export default function ProductDetails() {
  const loader = useLoaderData();
  const navigate = useNavigate();

  const handleBackButtonClick = () => {
    navigate("/app"); // Go back to the previous page
  };

  const handleEditButtonClick = () => {
    navigate(`/edit/${extractProductId(loader.data.product.id)}`);
  };
  const handleEditImageButtonClick = () => {
    navigate(`/editimage/${extractProductId(loader.data.product.id)}`);
  };

  return (
    <Page>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <Text as="h2" variant="headingMd">
                Fetched Product Detail
              </Text>
              <List type="bullet">
                <h1>Title: {loader.data.product.title}</h1>
                <p>Description: {loader.data.product.description}</p>
                <a href={loader.data.product.onlineStoreUrl} target="_blank" rel="noopener noreferrer">
                  View on Online Store
                </a>
              </List>
              <Button onClick={handleBackButtonClick}>Go Back</Button>
              <Button onClick={handleEditButtonClick}>Edit Description</Button>
              <Button onClick={handleEditImageButtonClick}>Update Image</Button>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
