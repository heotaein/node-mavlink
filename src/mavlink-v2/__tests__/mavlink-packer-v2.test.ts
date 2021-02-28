/*
 * mavlink-packer-v2.test.ts
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

import {CommandLong} from "../../../assets/messages/command-long";
import {MavCmd} from "../../../assets/enums/mav-cmd";
import {MAVLinkModule} from "../../mavlink-module";
import {messageRegistry} from "../../../assets/message-registry";
import {Statustext} from "../../../assets/messages/statustext";
import {Data32} from "../../../assets/messages/data32";

let mavlinkModule: MAVLinkModule;

beforeAll(() => {
});

afterAll(() => {
});

beforeEach(() => {
    mavlinkModule = new MAVLinkModule(messageRegistry, 1, false);
    mavlinkModule.upgradeLink();
});

afterEach(() => {
});

test('MessagePackUnpack', async () => {
    const cmd = new CommandLong(1, 0);
    cmd.command = MavCmd.MAV_CMD_REQUEST_PROTOCOL_VERSION;
    const messages = await mavlinkModule.parse(mavlinkModule.pack([cmd]));
    // @ts-ignore
    expect(messages[0].command).toBe(MavCmd.MAV_CMD_REQUEST_PROTOCOL_VERSION);
});

test('MessageCharArrayPack', async () => {
    let message_statustext_buffer: Buffer = Buffer.from('fd150000000101fd000006466c6967687420706c616e2072656365697665640d01', 'hex');

    let message_statustext = Object.assign(new Statustext(1, 1), {
        severity: 6,
        text: "Flight plan received"
    });

    expect((mavlinkModule.pack([message_statustext]))).toEqual(message_statustext_buffer);
});

test('MessageArrayPack', async () => {
    let message_data32_buffer: Buffer = Buffer.from('fd220000000163aa00008120fd130000530163004b000000000073b1ce' +
        '2540a832066a2700001800190a2201a889', 'hex');

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

    expect((mavlinkModule.pack([message_data32]))).toEqual(message_data32_buffer);
});

test('MessageArrayPackExtensions', async () => {
    let message_statustext_buffer: Buffer = Buffer.from('fd360000000101fd000003746573740000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000231cd', 'hex');

    let message_statustext = Object.assign(new Statustext(1, 1), {
        severity: 3,
        text: "test",
        id: 1,
        chunk_seq: 2
    });

    expect((mavlinkModule.pack([message_statustext]))).toEqual(message_statustext_buffer);
});

test('MessageArrayPackTruncate', async () => {
    let message_statustext_buffer: Buffer = Buffer.from('fd050000000101fd00000374657374b7a6', 'hex');

    let message_statustext = Object.assign(new Statustext(1, 1), {
        severity: 3,
        text: "test",
        id: 0,
        chunk_seq: 0
    });

    expect((mavlinkModule.pack([message_statustext]))).toEqual(message_statustext_buffer);
});