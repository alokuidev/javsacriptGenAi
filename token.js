import { get_encoding } from "tiktoken";

const encoderForGpt2 = get_encoding("gpt2");

const encoded = encoderForGpt2.encode("Hello, I am Alok!");

console.log(encoded); // Output: [15496, 11, 314, 389, 345, 30]

const decoded = encoderForGpt2.decode(encoded);
console.log(new TextDecoder().decode(decoded)); // Output: Hello, I am Alok!