/**
 * 后端服务器，对前端服务器连接的管理
 */

import Application from "../application";
import { SocketProxy, sessionApplyJson, loggerType, componentName } from "../util/interfaceDefine";
import define from "../util/define";
import { encodeRemoteData, encodeData } from "./msgCoder";


let app: Application;
let clients: { [id: string]: SocketProxy } = {};

export function init(_app: Application) {
    app = _app;
}

export function addClient(sid: string, socket: SocketProxy) {
    if (clients[sid]) {
        clients[sid].close();
    }
    clients[sid] = socket;
};

export function removeClient(sid: string) {
    delete clients[sid];
};

export function sendSession(session: sessionApplyJson) {
    if (clients[session.sid]) {
        let msgBuf = Buffer.from(JSON.stringify(session));
        let buf = Buffer.allocUnsafe(5 + msgBuf.length);
        buf.writeUInt32BE(1 + msgBuf.length, 0);
        buf.writeUInt8(define.Back_To_Front.applySession, 4);
        msgBuf.copy(buf, 5);
        clients[session.sid].send(buf);
    }
};

export function sendMsgByUidSid(cmdIndex: number, msg: any, uids: number[], sids: string[]) {
    let group = {} as any;
    for (let i = 0; i < sids.length; i++) {
        if (!group[sids[i]]) {
            group[sids[i]] = [];
        }
        group[sids[i]].push(uids[i]);
    }
    let msgBuf: Buffer = null as any;
    for (let sid in group) {
        if (clients[sid]) {
            if(!msgBuf){
                msgBuf = encodeData(cmdIndex, msg);
            }
            let buf = encodeRemoteData(group[sid], cmdIndex, msgBuf);
            clients[sid].send(buf);
        }
    }
};