import { randomBytes } from 'crypto'
import * as Seq from 'sequin'

const DEFAULT_BITS = 128
const DEFAULT_RADIX = 16
const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'.split('')

export default function (bits: number, radix: number): string {
    bits = bits || DEFAULT_BITS;
    radix = radix || DEFAULT_RADIX;

    if (radix < 2 || radix > 36)
        throw new Error('radix argument must be between 2 and 36');

    let length = Math.ceil(bits * Math.log(2) / Math.log(radix)),
        entropy = randomBytes(bits),
        stream = new Seq(entropy),
        string = '';

    while (string.length < length)
        string += DIGITS[stream.generate(radix)];

    return string;
};
