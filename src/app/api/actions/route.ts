/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ActionPostResponse,
  createActionHeaders,
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
} from "@solana/actions";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import * as IDL from "../../../types/picassol.json";

const headers = createActionHeaders({
  chainId: "devnet",
  actionVersion: "2.2.1",
});

const PROGRAM_ID = new PublicKey(
  "5rV2CJ8bYV4qEt8qcmhZ1Ty3o6eM7K1LAJDDFipPNyx2"
);

export const GET = async (req: Request) => {
  const payload: ActionGetResponse = {
    title: "Color a Random Pixel",
    icon: "https://your-icon-url.com/icon.png", // Replace with your icon URL
    description: "Color a random pixel on the Picassol canvas",
    label: "Color Pixel",
    links: {
      actions: [
        {
          label: "Color Random Pixel",
          href: "/api/actions/random-pixel",
        },
      ],
    },
  };

  return Response.json(payload, { headers });
};

export const POST = async (req: Request) => {
  const body: ActionPostRequest<string> = await req.json();

  // Extract the user's public key from the request
  const userPublicKey = new PublicKey(body.account);

  // Generate random pixel position and color
  const posX = Math.floor(Math.random() * 200);
  const posY = Math.floor(Math.random() * 200);
  const colR = Math.floor(Math.random() * 256);
  const colG = Math.floor(Math.random() * 256);
  const colB = Math.floor(Math.random() * 256);

  // Set up connection and provider
  const connection = new Connection("https://api.devnet.solana.com");
  const provider = new AnchorProvider(
    connection,
    { publicKey: userPublicKey } as any,
    { commitment: "processed" }
  );

  // Create program instance
  const program = new Program(IDL as any, provider);

  // Create transaction
  const transaction = await (program.methods
    .createPixel(posX, posY, colR, colG, colB) as any)
    .accounts({
      pixel: PublicKey.findProgramAddressSync(
        [Buffer.from("pixel"), Buffer.from([posX, posY])],
        PROGRAM_ID
      )[0],
      user: userPublicKey,
      systemProgram: PublicKey.default,
    })
    .transaction();

  const payload: ActionPostResponse = await createPostResponse({
    fields: {
      transaction, // Pass the transaction object directly
      message: `Color a random pixel at (${posX}, ${posY}) with RGB(${colR}, ${colG}, ${colB})`,
    },
  });

  return Response.json(payload, { headers });
};

export const OPTIONS = GET;
