/*
 * mavlink-parser-v2.test.ts
 *
 * Copyright (c) 2019, 
 * Institute of Flight Mechanics and Control, University of Stuttgart.
 * Pascal Groß <pascal.gross@ifr.uni-stuttgart.de>
 * All rights reserved.
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

import {MAVLinkModule} from "../../mavlink-module";
import {ParserState} from "../../parser-state.enum";
import {messageRegistry} from "../../../assets/message-registry";
import {MAVLinkMessage} from "../../mavlink-message";
import {MessageInterval} from "../../../assets/messages/message-interval";
import {Data32} from "../../../assets/messages/data32";
import {Statustext} from "../../../assets/messages/statustext";
import {ParamValue} from "../../../assets/messages/param-value";

let mavlinkModule: MAVLinkModule;

beforeAll(() => {
});

afterAll(() => {
});

beforeEach(() => {
    mavlinkModule = new MAVLinkModule(messageRegistry);
    mavlinkModule.upgradeLink();
});

afterEach(() => {
});

test('MessageStart', () => {
    mavlinkModule.parse(Buffer.from([0x02, 0x11, 0xFF, 0xFD, 0XFE]));
    // @ts-ignore
    expect(mavlinkModule.parser.state).toBe(ParserState.WaitingForHeaderComplete);
});

test('MessageStartTwoPass', () => {
    mavlinkModule.parse(Buffer.from([0x02, 0x11, 0xFF]));
    mavlinkModule.parse(Buffer.from([0xFD, 0XFE]));
    // @ts-ignore
    expect(mavlinkModule.parser.state).toBe(ParserState.WaitingForHeaderComplete);
});

test('MessageMultiple', () => {
    let data_multi: Buffer = Buffer.from('fd1500006a0101fd000006466c6967687420706c616e2072656365697665646dcb' +
        'fd0200006b01012f0000ffbe4bec', 'hex');

    mavlinkModule.parse(Buffer.from(data_multi)).then(messages => {expect(messages.length).toBe(2)})
});

test('NoMessageStart', () => {
    mavlinkModule.parse(Buffer.from([0x02, 0x11, 0xFF, 0XFE]));
    // @ts-ignore
    expect(mavlinkModule.parser.state).toBe(ParserState.WaitingForMagicByte);
});

test('MessageStartNotFound', () => {
    mavlinkModule.parse(Buffer.from([0x02, 0x11, 0xFF]));
    // @ts-ignore
    expect(mavlinkModule.parser.state).toBe(ParserState.WaitingForMagicByte);
});

test('MessageStartNotFoundEmptyBuffer', () => {
    mavlinkModule.parse(Buffer.from([0x02, 0x11, 0xFF]));
    // @ts-ignore
    expect(mavlinkModule.parser.buffer.length).toBe(0);
});

test('MessageTruncated', () => {
    const testMessage = new MessageInterval(255, 0);
    testMessage.interval_us = 1;
    const message_id = 2;
    testMessage.message_id = message_id;
    const testMessages: MAVLinkMessage[] = Array<MAVLinkMessage>();
    testMessages.push(testMessage);

    const buffer = mavlinkModule.pack(testMessages);
    return mavlinkModule.parse(buffer).then(message => {
        expect.assertions(1);
        // @ts-ignore
        expect(message[0].message_id).toBe(message_id);
    });
});

test('MessageArrayParse', async () => {
    let message_data32_buffer: Buffer = Buffer.from('fd220000530163aa00008120fd130000530163004b000000000073b1ce' +
        '2540a832066a2700001800190a2201af00', 'hex');

    let message_data32 = Object.assign(new Data32(1, 99), {
        type: 129,
        len: 32,
        data: [
            253,  19,  0,  0,  83,   1,  99,   0, 75,
            0,   0,  0,  0,   0, 115, 177, 206, 37,
            64, 168, 50,  6, 106,  39,   0,   0, 24,
            0,  25, 10, 34,   1
        ]
    });

    expect((await mavlinkModule.parse(message_data32_buffer))[0]).toEqual(message_data32);
});

test('MessageArrayParseTruncated', async () => {
    let message_data32_buffer: Buffer = Buffer.from('fd210000530163aa0000811ffd130000530163004b000000000073b1ce' +
        '2540a832066a2700001800190a22d761', 'hex');

    let message_data32 = Object.assign(new Data32(1, 99), {
        type: 129,
        len: 31,
        data: [
            253,  19,  0,  0,  83,   1,  99,   0, 75,
            0,   0,  0,  0,   0, 115, 177, 206, 37,
            64, 168, 50,  6, 106,  39,   0,   0, 24,
            0,  25, 10, 34, 0
        ]
    });

    expect((await mavlinkModule.parse(message_data32_buffer))[0]).toEqual(message_data32);
});

test('MessageCharArrayParse', async () => {
    let message_statustext_buffer: Buffer = Buffer.from('fd1500003f0101fd000006466c6967687420706c616e20726563656976656486b0', 'hex');

    let message_statustext = Object.assign(new Statustext(1, 1), {
        severity: 6,
        text: "Flight plan received"
    });

    expect((await mavlinkModule.parse(message_statustext_buffer))[0]).toEqual(message_statustext);

    let message_param_val_buffer: Buffer = Buffer.from('fd190000410101160000000000410f05ffff4d49535f544f54414c000000000000000432ac', 'hex');

    let message_param_val = Object.assign(new ParamValue(1, 1), {
        param_count: 1295,
        param_id: "MIS_TOTAL",
        param_index: 65535,
        param_type: 4,
        param_value: 8
    });

    expect((await mavlinkModule.parse(message_param_val_buffer))[0]).toEqual(message_param_val);
});

test('MessageExtensionsParse', async () => {
    let message_statustext_buffer: Buffer = Buffer.from('fd360000040101fd0000037465737400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010002d01b', 'hex');

    let message_statustext = Object.assign(new Statustext(1, 1), {
        severity: 3,
        text: "test",
        id: 1,
        chunk_seq: 2
    });

    expect((await mavlinkModule.parse(message_statustext_buffer))[0]).toEqual(message_statustext);
});
