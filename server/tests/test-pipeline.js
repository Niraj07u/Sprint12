import { io } from 'socket.io-client';
import assert from 'assert';

const SERVER_URL = 'http://localhost:4000';

async function runVerification() {
  console.log('--- STARTING WEBSOCKET PIPELINE MULTI-CLIENT VERIFICATION ---\n');

  // Client 1 connects
  const client1 = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    forceNew: true
  });

  // Client 2 connects
  const client2 = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    forceNew: true
  });

  // Client 3 connects (isolated room)
  const client3 = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    forceNew: true
  });

  try {
    // 1. Handshake verification (Phase 1)
    console.log('1. Verifying Client Handshakes (Phase 1)...');
    const [ack1, ack2, ack3] = await Promise.all([
      new Promise(res => client1.once('connection:ack', res)),
      new Promise(res => client2.once('connection:ack', res)),
      new Promise(res => client3.once('connection:ack', res))
    ]);

    assert(ack1.socketId, 'Client 1 should receive socketId');
    assert(ack2.socketId, 'Client 2 should receive socketId');
    assert(ack3.socketId, 'Client 3 should receive socketId');
    console.log(`✔ Handshake verified for 3 clients: [${ack1.socketId}, ${ack2.socketId}, ${ack3.socketId}]`);

    // 2. Session Registration (Phase 2)
    console.log('\n2. Verifying Session Identification (Phase 2)...');
    const sessionRes1 = await new Promise(res => {
      client1.emit('session:register', { username: 'Alice_Dev', avatar: '👩‍💻', role: 'Architect' }, res);
    });
    const sessionRes2 = await new Promise(res => {
      client2.emit('session:register', { username: 'Bob_Ops', avatar: '🚀', role: 'Telemetry' }, res);
    });
    const sessionRes3 = await new Promise(res => {
      client3.emit('session:register', { username: 'Charlie_QA', avatar: '🔍', role: 'QA Lead' }, res);
    });

    assert.strictEqual(sessionRes1.session.username, 'Alice_Dev');
    assert.strictEqual(sessionRes2.session.username, 'Bob_Ops');
    assert.strictEqual(sessionRes3.session.username, 'Charlie_QA');
    console.log('✔ Session registration verified for Alice, Bob, and Charlie');

    // 3. Room Routing & Subscription (Phase 3)
    console.log('\n3. Joining Rooms (Phase 3)...');
    // Client 1 & 2 join 'architecture-design'
    await Promise.all([
      new Promise(res => client1.emit('room:join', { roomId: 'architecture-design' }, res)),
      new Promise(res => client2.emit('room:join', { roomId: 'architecture-design' }, res))
    ]);
    // Client 3 joins 'telemetry-pipeline'
    await new Promise(res => client3.emit('room:join', { roomId: 'telemetry-pipeline' }, res));
    console.log('✔ Client 1 and Client 2 subscribed to #architecture-design; Client 3 subscribed to #telemetry-pipeline');

    // 4. Typing Indicator (Phase 2)
    console.log('\n4. Verifying Real-Time Typing Indicator (Phase 2)...');
    const typingPromise = new Promise(resolve => {
      client2.on('typing:update', data => {
        if (data.typingUsers.some(u => u.username === 'Alice_Dev')) {
          resolve(data);
        }
      });
    });

    client1.emit('typing:start', { roomId: 'architecture-design' });
    const typingUpdate = await typingPromise;
    assert.strictEqual(typingUpdate.roomId, 'architecture-design');
    console.log('✔ Client 2 received typing indicator from Alice_Dev in #architecture-design');

    // 5. Bidirectional Room-Isolated Broadcast (Phase 1 & Phase 3)
    console.log('\n5. Verifying Strict Room Isolation & Broadcast (Phase 1 & 3)...');
    let client3ReceivedMessageInOtherRoom = false;
    client3.on('message:broadcast', (msg) => {
      if (msg.type === 'user' && msg.text === 'Deploying Design System v2.4') {
        client3ReceivedMessageInOtherRoom = true;
      }
    });

    const client2MessagePromise = new Promise(resolve => {
      client2.on('message:broadcast', msg => {
        if (msg.type === 'user' && msg.text === 'Deploying Design System v2.4') {
          resolve(msg);
        }
      });
    });

    // Client 1 dispatches message in architecture-design
    client1.emit('message:send', {
      roomId: 'architecture-design',
      text: 'Deploying Design System v2.4'
    });

    const receivedMessage = await client2MessagePromise;
    assert.strictEqual(receivedMessage.sender.username, 'Alice_Dev');
    assert.strictEqual(receivedMessage.roomId, 'architecture-design');
    console.log('✔ Client 2 in #architecture-design successfully intercepted payload from Alice_Dev');

    // Wait a brief tick to ensure Client 3 did NOT receive it
    await new Promise(r => setTimeout(r, 400));
    assert.strictEqual(client3ReceivedMessageInOtherRoom, false, 'Client 3 in different room MUST NOT receive message!');
    console.log('✔ STRICT ISOLATION CONFIRMED: Client 3 in #telemetry-pipeline did NOT receive payload from #architecture-design');

    // 6. Latency Ping-Pong Check
    console.log('\n6. Verifying Heartbeat / Latency Ping-Pong...');
    const now = Date.now();
    const pongData = await new Promise(resolve => {
      client1.once('latency:pong', resolve);
      client1.emit('latency:ping', now);
    });
    assert.strictEqual(pongData.clientTimestamp, now);
    console.log(`✔ Latency Pong received in ${Date.now() - now}ms`);

    console.log('\n🎉 ALL FULLSTACK WS PIPELINE PHASES (P0, P1, P2) FULLY VALIDATED! 🎉\n');
  } finally {
    client1.disconnect();
    client2.disconnect();
    client3.disconnect();
  }
}

runVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
