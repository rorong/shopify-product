// routes/product/edit/[productId].js
import { authenticate } from '../shopify.server';
import { json, redirect, ActionFunctionArgs } from '@remix-run/node';
import { useState } from 'react';
import { AppProvider as PolarisAppProvider, TextField, Button, Layout, Page } from '@shopify/polaris';
import { Form, useLoaderData,useNavigate } from '@remix-run/react';

import OpenAI from 'openai';
import { title } from 'process';

async function descriptionOpenAIUpdate(description,title) {
  try {
    const openaiApiKey = process.env.OPEN_API_KEY;
    console.log("scghsdvjgs>>>>>>>>>>>>>>>>>>>>",openaiApiKey)
    const client = new OpenAI({apiKey: openaiApiKey});
    console.log("client>>>>>>>>>>>>>>>>>>>>",client);
    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { "role": "system", "content": "I want you to act as SEO expert. I will provide you title and description and you would provide me a SEO optimized , detailed description highlighting major features and mentioning the type of audience it would be best suited for.  Do not exceed over 500 words.  Keep the context within the shared description only. I  would like to write description for" },
        { "role": "user", "content": `providing  Title: ${title} and Description: ${description}` }
      ],
      temperature: 0.1 // You can adjust the temperature as needed
    });


console.log("description>>>>>>>>>>>>>>>>>>>>",completion);
    return completion.choices[0].message.content;
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
  // const loaderData = useLoaderData();
  // invariant(params.productId, "Missing productId param");
  const formData = await request.formData();
  // const data = Object.fromEntries(await request.formData());
  console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<",formData);

  const updates = Object.fromEntries(formData);
  const loaderData = JSON.parse(updates.loaderData);

  console.log("Loader Data:>>>>>>>>>>>>>>>>>>>>>>>>", loaderData.data.product.title);

  // console.log("<<<<<<<<<<<<<<<<<?????????????????<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<",updates.loaderData.data);
  const existingDescription = updates.newDescription;
  const title = loaderData.data.product.title
  const generatedDescription = await descriptionOpenAIUpdate(existingDescription ,title);
  try {
    // Authenticate with Shopify admin
    const { admin } = await authenticate.admin(request);

    // Make GraphQL mutation to update product description using variables
    const updateResponse = await admin.graphql(
      `#graphql
        mutation updateProduct($input: ProductInput!) {
          productUpdate(input: $input) {
            product {
              id
              title
              description
              descriptionHtml
                }
              }
        }`,
        {
          variables: {
            input:{
            id: `gid://shopify/Product/${params.productId}`,
            descriptionHtml: generatedDescription,
            handle: "this is handle"
        }
      }
    }
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
                label="New Product Description"
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
