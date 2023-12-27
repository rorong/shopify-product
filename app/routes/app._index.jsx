import { useEffect } from "react";
import { json } from "@remix-run/node";
import { useActionData, useNavigation, useSubmit, useLoaderData,Link } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  InlineStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { extractProductId } from './utils'; 
export const loader = async ({ request }) => {
  // await authenticate.admin(request);
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(`
  #graphql
    query {
      products(first: 50, reverse: true) {
        edges {
          node {
            id
            title
            handle
            description
            resourcePublicationOnCurrentPublication {
              publication {
                name
                id
              }
              publishDate
              isPublished
            }
          }
        }
      }
    }`,
  );

  const productListingData = await response.json();
  console.log("///////////////////////////////////////////////////////",productListingData.data.products.edges[0],"---------------------------------<<<<<<<<<<<<<<<<<<<<<<")
  return productListingData;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        input: {
          title: `${color} Snowboard`,
          variants: [{ price: Math.random() * 100 }],
        },
      },
    }
  );
  const responseJson = await response.json();

  return json({
    product: responseJson.data.productCreate.product,
  });
};

export default function Index() {
  const loader = useLoaderData();
  const nav = useNavigation();
  const actionData = useActionData();
  const submit = useSubmit();
  const isLoading =
    ["loading", "submitting"].includes(nav.state) && nav.formMethod === "POST";
  const productId = actionData?.product?.id.replace(
    "gid://shopify/Product/",
    ""
  );

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId]);
  const generateProduct = () => submit({}, { replace: true, method: "POST" });

  return (
    <Page>
      <ui-title-bar title="Remix app template">
        <button variant="primary" onClick={generateProduct}>
          Generate a product
        </button>
      </ui-title-bar>
      <BlockStack gap="500">
        <Layout>
        <Layout.Section>
          <Card>
            <Text as="h2" variant="headingMd">
              Fetched Products
            </Text>
            <List type="bullet">
              {loader.data.products.edges.map((product) => (
                <List.Item key={product.node.id}>
                  <Link to={`/app/product/${extractProductId(product.node.id)}`}>
                    {product.node.title}
                  </Link>
                </List.Item>
              ))}
            </List>
          </Card>
        </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
