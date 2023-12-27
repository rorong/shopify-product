// routes/product/edit/[productId].js
import { authenticate } from '../shopify.server';
import { json, redirect, ActionFunctionArgs } from '@remix-run/node';
import { useState } from 'react';
import { AppProvider as PolarisAppProvider, TextField, Button, Layout, Page } from '@shopify/polaris';
import { Form, useLoaderData,useNavigate } from '@remix-run/react';

import OpenAI from 'openai';

async function descriptionOpenAIUpdate(description) {
  try {
    const openaiApiKey = process.env.OPEN_API_KEY;
    console.log("scghsdvjgs>>>>>>>>>>>>>>>>>>>>",openaiApiKey)
    const client = new OpenAI({apiKey: openaiApiKey});
    console.log("client>>>>>>>>>>>>>>>>>>>>",client);
    const completion = await client.images.generate({
        model: "dall-e-2",
        prompt: description,
        size: "1024x1024",
        quality: "standard",
        n: 1,
    });

    image_url = completion.data[0].url
console.log("description>>>>>>>>>>>>>>>>>>>>",image_url);
    return image_url;
  } catch (error) {
    console.error('OpenAI API error:', error);
    return 'Failed to generate description'; // Handle error appropriately
  }
}

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
          images(first: 10) {
            edges {
              node {
                id
                url
              }
            }
          }
        }
      }`,
    );

    // Parse and return the product details
    const productDetail = await response.json();
    console.log("Product details:", productDetail);
    return productDetail;
  } catch (error) {
    console.error('Error fetching product details:', error);
    return json({ error: 'Failed to fetch product details.' }, 500);
  }
};

export async function action({request,params}) {
//   console.log("product_id>>>>>>>>>>>>>>>",params.productId);
  // invariant(params.productId, "Missing productId param");
  const formData = await request.formData();
  // const data = Object.fromEntries(await request.formData());
//   console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<",formData);

  const updates = Object.fromEntries(formData);
//   console.log("<<<<<<<<<<<<<<<<<?????????????????<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<",updates);
  const existingDescription = updates.newDescription;
  const loaderData = JSON.parse(updates.loaderData);
  console.log("????????????????????loaderdtaa:::::::::::::::::",loaderData.data.product.images.edges[0].node.id);
  const image_id = loaderData.data.product.images.edges[0].node.id;
  const generatedImage = await descriptionOpenAIUpdate(existingDescription);
// const generatedImage = "https://cdn.shopify.com/s/files/1/0634/0588/3556/files/Main.jpg?v=1702364432"

  try {
    // Authenticate with Shopify admin
    const { admin } = await authenticate.admin(request);

    const updateResponse = await admin.graphql(
      `#graphql
      mutation productImageUpdate($productId: ID!, $image: ImageInput!) {
        productImageUpdate(productId: $productId, image: $image) {
          image {
            id
            altText
            src
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          "productId": `gid://shopify/Product/${params.productId}`,
          "image": {
            "id": image_id,
            "altText": "New image added.",
            "src": generatedImage
          }
        },
      },
    );
    
    const updateData = await updateResponse.json();
    console.log("????????????????????????????????????","productId")
    console.log('Product updated:', updateData);

    // Redirect to the product details page after a successful update
    return redirect(`/app/product/${params.productId}`);
  } catch (error) {
    console.error('Error updating product:', error);
    // Handle error or redirect to an error page
    return json({ error: 'Failed to update product.' }, 500);
  }
};
// function handleSubmit(e,params){
//   e.prevent_default
//   console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>",params)
//   action(request)
// }
export default function EditProductDetail() {
  const loaderData = useLoaderData();
  console.log("abhjasbjhhbj>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", loaderData, ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>?????????????????");

  const [newDescription, setNewDescription] = useState('');
  const navigate = useNavigate();
  const handleBackButtonClick = () => {
    navigate("/app"); // Go back to the previous page
  };
  return (
    <PolarisAppProvider i18n={loaderData.polarisTranslations}>
      <Page>
        <Layout>
          <Layout.Section>
            <Form method="post" >
            <input type="hidden" name="loaderData" value={JSON.stringify(loaderData)} />
              <TextField
                label="Provide description to update image"
                name="newDescription"
                value={newDescription}
                onChange={(value) => setNewDescription(value)}
                multiline
              />
              <button >
                Update Description
              </button>
              <Button onClick={handleBackButtonClick}>Go Back</Button>
            </Form>
          </Layout.Section>
        </Layout>
      </Page>
    </PolarisAppProvider>
  );
}
