const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const insertUser = (username, role) => {
    return new Promise((resolve) => {
        const hash = bcrypt.hashSync('senha123', 8);
        db.run('INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)', [username, hash, role], function() {
            resolve(this.lastID);
        });
    });
};

const insertTicket = (title, desc, status, queue, userId, notes) => {
    db.run(
        `INSERT INTO tickets (title, description, status, queue, user_id, resolution_notes, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-' || abs(random() % 30) || ' days'))`, 
         [title, desc, status, queue, userId, notes]
    );
};

const seed = async () => {
    console.log("Seeding Database for BI Reports...");
    
    // Create Users
    await insertUser('admin_master', 'admin');
    const u1 = await insertUser('joao_silva', 'user');
    const u2 = await insertUser('maria_santos', 'user');
    const u3 = await insertUser('empresa_x', 'user');

    // Mocks array
    const users = [u1, u2, u3].filter(id => id !== 0 && id !== undefined);

    if(users.length > 0) {
        insertTicket('Problema no login', 'Não consigo acessar o sistema ERP', 'concluido', 'Suporte N1', users[0], 'Senha resetada pelo AD.');
        insertTicket('Erro na emissão de NF', 'A nota rejeita com erro 502', 'em_analise', 'Suporte N2', users[1], 'Analisando log da Sefaz...');
        insertTicket('Solicitação de Teclado', 'Teclado com a tecla Enter quebrou', 'aberto', 'Suporte N1', users[2], null);
        insertTicket('Sistema lento', 'Tudo demora para carregar hoje', 'respondido', 'Suporte N2', users[0], 'Limpeza de cache realizada, aguardando validação do cliente.');
        insertTicket('Dúvida sobre férias', 'Como calculo minhas férias no app?', 'concluido', 'Suporte N1', users[1], 'Tutorial enviado por email.');
        insertTicket('Falha no banco de dados', 'Erro de conexão SQL no app de vendas', 'em_analise', 'Suporte N3', users[2], 'Avaliando uso de CPU do cluster AWS.');
        insertTicket('Ajuste de Permissão', 'Preciso de acesso à pasta Z', 'concluido', 'Suporte N1', users[0], 'Acesso concedido no grupo do Windows.');
    }

    console.log("Seed finished. Added mock users and tickets!");
    setTimeout(() => process.exit(0), 1000);
};

seed();
