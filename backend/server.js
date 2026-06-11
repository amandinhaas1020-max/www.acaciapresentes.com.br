const express = require("express");
const cors = require("cors");
const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();
app.use(cors());
app.use(express.json());

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

app.get("/", (req, res) => {
  res.send("Backend Mercado Pago + Melhor Envio funcionando!");
});

// PAGAMENTO MERCADO PAGO
app.post("/criar-pagamento", async (req, res) => {
  try {
    const { titulo, preco, quantidade } = req.body;

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            title: titulo || "Produto",
            quantity: Number(quantidade) || 1,
            unit_price: Number(preco)
          }
        ],
        back_urls: {
          success: "https://www.acaciapresentes.com.br",
          failure: "https://www.acaciapresentes.com.br",
          pending: "https://www.acaciapresentes.com.br"
        },
        auto_return: "approved"
      }
    });

    res.json({ init_point: result.init_point });
  } catch (error) {
    console.error("Erro Mercado Pago:", error);
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
});

// FRETE MELHOR ENVIO
app.post("/calcular-frete", async (req, res) => {
  try {
    const { cepDestino, produtos } = req.body;

    if (!cepDestino) {
      return res.status(400).json({ error: "CEP de destino é obrigatório" });
    }

    const body = {
      from: {
        postal_code: process.env.CEP_ORIGEM
      },
      to: {
        postal_code: String(cepDestino).replace(/\D/g, "")
      },
      products: produtos && produtos.length ? produtos : [
        {
          id: "1",
          width: 15,
          height: 5,
          length: 20,
          weight: 0.3,
          insurance_value: 50,
          quantity: 1
        }
      ],
      options: {
        receipt: false,
        own_hand: false
      },
      services: "1,2"
    };

    const response = await fetch("https://www.melhorenvio.com.br/api/v2/me/shipment/calculate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Acacia Presentes (amandinhaa.s1020@gmail.com)"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro Melhor Envio:", data);
      return res.status(response.status).json({
        error: "Erro ao calcular frete",
        details: data
      });
    }

    res.json(data);
  } catch (error) {
    console.error("Erro no frete:", error);
    res.status(500).json({ error: "Erro interno ao calcular frete" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando na porta " + PORT));
