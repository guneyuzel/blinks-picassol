import {
  ActionPostResponse,
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
  createActionHeaders,
} from "@solana/actions";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import * as idl from "../../../types/picassol.json";

const headers = createActionHeaders();

export const GET = async (req: Request) => {
  try {
    const payload: ActionGetResponse = {
      type: "action",
      title: "Update Pixel on Picassol",
      icon: "https://pbs.twimg.com/profile_images/1770621903205498880/g9wkbNPV_400x400.jpg",
      description:
        "Create or update a pixel with random colors and position on Picassol.",
      label: "Update Pixel",
    };

    return Response.json(payload, { headers });
  } catch (err) {
    console.error(err);
    return new Response("An error occurred", { status: 500, headers });
  }
};

export const POST = async (req: Request) => {
  try {
    const body: ActionPostRequest = await req.json();

    // Validate the client provided input
    let userPubkey: PublicKey;
    try {
      userPubkey = new PublicKey(body.account);
    } catch (err) {
      return new Response('Invalid "account" provided', {
        status: 400,
        headers,
      });
    }

    // Connect to the Solana network
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com"
    );
    const provider = new AnchorProvider(
      connection,
      { publicKey: userPubkey } as any,
      { commitment: "confirmed" }
    );
    const program = new Program(idl as any, provider);

    // Generate random pixel data
    const posX = Math.floor(Math.random() * 64);
    const posY = Math.floor(Math.random() * 64);
    const colR = Math.floor(Math.random() * 256);
    const colG = Math.floor(Math.random() * 256);
    const colB = Math.floor(Math.random() * 256);

    // Get pixel address
    const [pixelPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from("pixel"), Buffer.from([posX, posY])],
      program.programId
    );

    // Create transaction
    const transaction = new Transaction();

    // Check if pixel exists and add appropriate instruction
    const pixelAccount = await connection.getAccountInfo(pixelPubkey);
    if (!pixelAccount) {
      transaction.add(
        await program.methods
          .createPixel(posX, posY, colR, colG, colB)
          .accounts({
            pixel: pixelPubkey,
            user: userPubkey,
            systemProgram: SystemProgram.programId,
          })
          .instruction()
      );
    } else {
      transaction.add(
        await program.methods
          .updatePixel(colR, colG, colB)
          .accounts({
            pixel: pixelPubkey,
            user: userPubkey,
          })
          .instruction()
      );
    }

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message: `Update pixel at (${posX}, ${posY}) with color rgb(${colR}, ${colG}, ${colB})`,
      },
    });

    return Response.json(payload, { headers });
  } catch (err) {
    console.error(err);
    return new Response("An error occurred", { status: 500, headers });
  }
};

export const OPTIONS = async (req: Request) => {
  return new Response(null, { headers });
};
