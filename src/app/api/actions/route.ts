import {
  ActionPostResponse,
  createActionHeaders,
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
} from "@solana/actions";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
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
    icon: "https://fps.cdnpk.net/images/home/subhome-ai.webp?w=649&h=649",
    description: "Color a random pixel on the Picassol canvas",
    label: "Color Pixel",
    links: {
      actions: [
        {
          label: "Color Random Pixel",
          href: "/api/actions",
        },
        {
          label: "Custom Color",
          href: "/api/actions?r={r}&g={g}&b={b}",
          parameters: [
            { name: "r", label: "Red (0-255)", type: "number", required: true },
            { name: "g", label: "Green (0-255)", type: "number", required: true },
            { name: "b", label: "Blue (0-255)", type: "number", required: true },
          ],
        },
      ],
    },
  };

  return Response.json(payload, { headers });
};

export const POST = async (req: Request) => {
  try {
    const body: ActionPostRequest = await req.json();
    const userPublicKey = new PublicKey(body.account);

    const url = new URL(req.url);
    const r = parseInt(url.searchParams.get("r") || String(Math.floor(Math.random() * 256)));
    const g = parseInt(url.searchParams.get("g") || String(Math.floor(Math.random() * 256)));
    const b = parseInt(url.searchParams.get("b") || String(Math.floor(Math.random() * 256)));

    // Generate random pixel position
    const posX = Math.floor(Math.random() * 200);
    const posY = Math.floor(Math.random() * 200);

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
      .createPixel(posX, posY, r, g, b) as any)
      .accounts({
        pixel: PublicKey.findProgramAddressSync(
          [Buffer.from("pixel"), Buffer.from([posX, posY])],
          PROGRAM_ID
        )[0],
        user: userPublicKey,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message: `Color a random pixel at (${posX}, ${posY}) with RGB(${r}, ${g}, ${b})`,
      },
    });

    return Response.json(payload, { headers });
  } catch (err) {
    console.error(err);
    return new Response("An error occurred while processing the request", {
      status: 500,
      headers,
    });
  }
};

export const OPTIONS = async (req: Request) => {
  return new Response(null, { headers });
};
