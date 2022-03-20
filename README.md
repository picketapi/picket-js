## **Picket-js ES Module**

Use picket as an ES module.


## Installation

```shell
npm install @picketapi/picket-js
```

## Usage

```
Picket()
```
The Picket funcion creates and returns a promise that resolves to a new instance of the Picket class. It takes an API key as a parameter.

```
import Picket from "@picketapi/picket-js"
const picket = await Picket("pk-1234-2938-18fs-sj87")
```

We’ve placed a random API key in this example. Replace it with your [actual api keys](https://picketapi.com/dashboard).


```
connect()
```
The `connect` function triggers a wallet connection request to the user as well as a signing request. It returns a promise that resolves to a wallet object containing walletAddress and signature. It takes no parameters. If you call connect server-side it will resolve to null.

For more information on how to use Picket, please refer to the [Picket API reference](https://picketapi.com/docs).