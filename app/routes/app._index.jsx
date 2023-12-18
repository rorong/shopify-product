import { useEffect } from "react";
import { json } from "@remix-run/node";
import { useActionData, useNavigation, useSubmit, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  // await authenticate.admin(request);
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(`
  #graphql
    query {
      products(first: 10, reverse: true) {
        edges {
          node {
            id
            title
            handle
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
//  const productListingData = JSON.parse(loader);
 console.log('===========================>>>>>>>>>>>>>>>>>>>>>', loader, '<<<<<<<<<<<<<<<<<<<<<<<<<<+========================')
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
              {console.log('===========================>>>>>>>>>>>>>>>>>>>>>', loader.data.products.edges, '<<<<<<<<<<<<<<<<<<<<<<<<<<+========================')}
              {loader.data.products.edges.map((product) => (
                <List.Item key={product.node.id}>
                  {product.node.title} - {product.node.handle}
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
