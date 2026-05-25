// Estado da aplicação
let currentUser = null;
let currentUserType = null;
let currentMonth = 4; // Maio (Base zero, 4 = Maio)
let currentYear = 2026;

let appointments = JSON.parse(localStorage.getItem('appointments')) || {};
let selectedDate = null;

// Corrigir problema de fuso horário na formatação
function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Usuário exemplo
const users = {
    prestador: {
        username: 'admin',
        password: '123',
        name: 'Lucas - Prestador'
    }
};

// Login
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const userType = document.querySelector('input[name="userType"]:checked').value;

    if (
        users[userType] &&
        users[userType].username === username &&
        users[userType].password === password
    ) {
        currentUser = users[userType];
        currentUserType = userType;

        // Oculta o container completo de login e exibe a aplicação principal
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');

        document.getElementById('currentUser').textContent = currentUser.name;

        initCalendar();
    } else {
        alert('❌ Usuário ou senha incorretos!');
    }
}

// Logout
function logout() {
    currentUser = null;
    currentUserType = null;

    // Remove a aplicação principal e reexibe a tela cheia do login
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');

    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// Iniciar calendário
function initCalendar() {
    generateCalendar(currentMonth, currentYear);
    updateDateInput();
}

// Gerar calendário dinamicamente
function generateCalendar(month, year) {
    const calendarGrid = document.getElementById('calendarGrid');
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    
    // Retroceder para o início do domingo da primeira semana
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // Cabeçalho dos dias da semana
    calendarGrid.innerHTML = `
        <div class="day-header">Dom</div>
        <div class="day-header">Seg</div>
        <div class="day-header">Ter</div>
        <div class="day-header">Qua</div>
        <div class="day-header">Qui</div>
        <div class="day-header">Sex</div>
        <div class="day-header">Sáb</div>
    `;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Renderizar as 6 linhas possíveis do calendário (42 dias)
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        date.setHours(0, 0, 0, 0);

        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell';

        // Customização de dias fora do mês corrente
        if (date.getMonth() !== month) {
            dayCell.style.opacity = '0.4';
        }
        // Bloqueio de dias passados
        else if (date < today) {
            dayCell.style.opacity = '0.3';
            dayCell.style.background = '#f5f5f5';
            dayCell.style.cursor = 'not-allowed';
            dayCell.style.pointerEvents = 'none';
        }
        // Ativar clique para dias válidos
        else {
            dayCell.onclick = (event) => selectDate(date, event.currentTarget);
        }

        // Destacar dia atual
        if (date.toDateString() === today.toDateString()) {
            dayCell.classList.add('today');
        }

        const dayKey = formatLocalDate(date);
        const dayAppointments = appointments[dayKey] || [];

        // Adicionar classe caso o dia possua agendamentos
        if (dayAppointments.length > 0) {
            dayCell.classList.add('appointment');
        }

        // Construção interna da célula
        dayCell.innerHTML = `
            <div class="day-number">${date.getDate()}</div>
            <div class="appointments-list">
                ${dayAppointments
                    .slice(0, 2)
                    .map(ap => `${ap.horario} - ${ap.cliente.substring(0, 8)}...`)
                    .join('<br>')}
                ${dayAppointments.length > 2 ? `<br><strong>+${dayAppointments.length - 2} mais</strong>` : ''}
            </div>
        `;

        calendarGrid.appendChild(dayCell);
    }

    // Atualizar título do Mês/Ano corrente
    document.getElementById('monthYear').textContent =
        firstDay.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
}

// Selecionar data no calendário
function selectDate(date, targetElement) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    if (selected < today) {
        alert('⚠️ Não é possível agendar em dias anteriores!');
        return;
    }

    selectedDate = formatLocalDate(date);
    document.getElementById('dataAgendamento').value = selectedDate;

    updateAppointmentsList();

    // Resetar estilos visuais de seleção de todas as células ativas
    document.querySelectorAll('.day-cell').forEach(cell => {
        cell.style.boxShadow = '';
        cell.style.borderColor = '#f0f0f0';
    });

    // Aplicar destaque na célula clicada usando borda/sombra para não quebrar o .today ou .appointment
    targetElement.style.borderColor = '#764ba2';
    targetElement.style.boxShadow = '0 0 0 3px rgba(118, 75, 162, 0.3)';
}

// Atualizar lista lateral/inferior de atendimentos do dia selecionado
function updateAppointmentsList() {
    const list = document.getElementById('appointmentsList');
    const dayAppointments = appointments[selectedDate] || [];

    if (dayAppointments.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#666;font-style:italic;">📭 Nenhum agendamento para este dia.</p>';
        return;
    }

    list.innerHTML = dayAppointments
        .map((ap, index) => `
            <div class="appointment-item">
                <div class="appointment-header">
                    <strong>🕒 ${ap.horario} - ${ap.cliente}</strong>
                    <span class="status-badge status-${ap.status}">
                        ${ap.status.replace('-', ' ').toUpperCase()}
                    </span>
                </div>
                <div style="margin-bottom: 10px;">
                    <strong>✂️ Serviço:</strong> ${ap.servico}
                </div>
                <div style="display:flex;gap:10px;align-items:center;">
                    <select
                        onchange="updateStatus('${selectedDate}', ${index}, this.value)"
                        style="flex:1;padding:8px;border:2px solid #e1e5e9;border-radius:8px;"
                    >
                        <option value="agendado" ${ap.status === 'agendado' ? 'selected' : ''}>⏳ Agendado</option>
                        <option value="reagendado" ${ap.status === 'reagendado' ? 'selected' : ''}>🔄 Reagendado</option>
                        <option value="em-atendimento" ${ap.status === 'em-atendimento' ? 'selected' : ''}>⚡ Em Atendimento</option>
                        <option value="concluido" ${ap.status === 'concluido' ? 'selected' : ''}>✅ Concluído</option>
                        <option value="cancelado" ${ap.status === 'cancelado' ? 'selected' : ''}>❌ Cancelado</option>
                    </select>
                    <button
                        onclick="removerAgendamento('${selectedDate}', ${index})"
                        style="background:#ff4444;color:white;border:none;padding:10px 15px;border-radius:8px;cursor:pointer;font-weight:bold;"
                    >
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
}

// Adicionar novo agendamento por formulário (CONECTADO COM O BACK-END C#)
function adicionarAgendamento() {
    const cliente = document.getElementById('clienteNome').value.trim();
    const servicoSelect = document.getElementById('servico');
    const data = document.getElementById('dataAgendamento').value;
    const horario = document.getElementById('horario').value;
    const status = document.getElementById('status').value;

    // VALIDAR CAMPOS
    if (!cliente || !servicoSelect.value || !data || !horario) {
        alert('❌ Preencha todos os campos obrigatórios!');
        return;
    }

    // BLOQUEAR DATAS PASSADAS
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parts = data.split('-');
    const selectedDateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    selectedDateObj.setHours(0, 0, 0, 0);

    if (selectedDateObj < today) {
        alert('⚠️ Não é permitido agendar em datas anteriores!');
        return;
    }

    // CRIAR DIA
    if (!appointments[data]) {
        appointments[data] = [];
    }

    // LIMITE DIÁRIO
    if (appointments[data].length >= 10) {
        alert('⚠️ Limite de 10 clientes atingido para este dia!');
        return;
    }

    // BLOQUEAR HORÁRIOS PASSADOS
    const agora = new Date();
    const hojeFormatado = formatLocalDate(agora);

    if (data === hojeFormatado) {
        const horaAtual = agora.getHours();
        const horaSelecionada = parseInt(horario.split(':')[0]);

        if (horaSelecionada <= horaAtual) {
            alert('⚠️ Este horário já passou!');
            return;
        }
    }

    // BLOQUEAR HORÁRIO DE ALMOÇO
    if (horario === '11:00' || horario === '12:00') {
        alert('🍽️ Horário reservado para almoço!');
        return;
    }

    // HORÁRIO DUPLICADO
    const horarioExists = appointments[data].some(ap => ap.horario === horario);
    if (horarioExists) {
        alert('⚠️ Horário já ocupado neste dia!');
        return;
    }

    const textoServico = servicoSelect.selectedOptions[0].text;

    // --- INTEGRAÇÃO COM O BACK-END EM C# ---
    const dadosParaOBackend = {
        nomeCliente: cliente,
        servico: textoServico,
        dataAgendamento: data,     
        horario: horario
    };

  fetch('http://localhost:5295/api/Agendamento', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(dadosParaOBackend)
}) 
.then(async resposta => {

    const texto = await resposta.text();

    if (!resposta.ok) {
        throw new Error(texto);
    }

    return JSON.parse(texto);
})
.then(apiDados => {
    console.log('Salvo no MySQL com sucesso!', apiDados);
    alert("Agendamento realizado com sucesso!"); 
    
    appointments[data].push({
        cliente,
        servico: textoServico,
        horario,
        status
    });

    localStorage.setItem('appointments', JSON.stringify(appointments));
    

        generateCalendar(currentMonth, currentYear);
        if (data === selectedDate) {
            updateAppointmentsList();
        }

        // LIMPAR FORMULÁRIO
        document.getElementById('clienteNome').value = '';
        servicoSelect.value = '';
        document.getElementById('horario').value = '';
        document.getElementById('status').value = 'agendado';

        // MENSAGEM DE SUCESSO DO BANCO
        alert('🚀 ' + apiDados.mensagem);
    })
  .catch(async erro => {
    console.error(erro);
    alert('ERRO REAL: ' + erro.message);
});
}

// Atualizar status do atendimento direto do card
function updateStatus(date, index, newStatus) {
    if (appointments[date]) {
        const statusAtual = appointments[date][index].status;

        // BLOQUEAR CANCELADO E CONCLUÍDO
        if (statusAtual === 'cancelado' || statusAtual === 'concluido') {
            alert('⚠️ Este status não pode mais ser alterado!');
            updateAppointmentsList();
            return;
        }

        // EM ATENDIMENTO SÓ PODE VIRAR CONCLUÍDO
        if (statusAtual === 'em-atendimento' && newStatus !== 'concluido') {
            alert('⚠️ Atendimento em permanence só pode ser concluído!');
            updateAppointmentsList();
            return;
        }

        // ALTERAR STATUS
        appointments[date][index].status = newStatus;

        localStorage.setItem('appointments', JSON.stringify(appointments));
        updateAppointmentsList();
        generateCalendar(currentMonth, currentYear);

        let mensagem = '';
        if (newStatus === 'agendado') mensagem = '✅ Atendimento marcado como agendado!';
        else if (newStatus === 'reagendado') mensagem = '🔄 Atendimento reagendado!';
        else if (newStatus === 'em-atendimento') Black = '⚡ Atendimento iniciado!';
        else if (newStatus === 'concluido') mensagem = '✅ Atendimento concluído!';
        else if (newStatus === 'cancelado') mensagem = '❌ Atendimento cancelado!';

        alert(mensagem);
    }
}

// Deletar agendamento permanente
function removerAgendamento(date, index) {
    if (appointments[date]) {
        const statusRemovido = appointments[date][index]?.status;
        let mensagemConfirmacao = '🗑️ Tem certeza que deseja remover este registro?';

        if (confirm(mensagemConfirmacao)) {
            appointments[date].splice(index, 1);
            if (appointments[date].length === 0) {
                delete appointments[date];
            }

            localStorage.setItem('appointments', JSON.stringify(appointments));
            updateAppointmentsList();
            generateCalendar(currentMonth, currentYear);
            alert('✅ Registro removido com sucesso!');
        }
    }
}

// Navegação de Meses
function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    generateCalendar(currentMonth, currentYear);
    updateDateInput();
}

// Navegação de Meses Avançar
function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    generateCalendar(currentMonth, currentYear);
    updateDateInput();
}

// Atualizar o estado da data selecionada baseado no dia atual
function updateDateInput() {
    const today = new Date();
    const formattedToday = formatLocalDate(today);

    document.getElementById('dataAgendamento').value = formattedToday;
    document.getElementById('dataAgendamento').min = formattedToday;

    selectedDate = formattedToday;
    updateAppointmentsList();
}

// Atalho para submissão do login via tecla Enter
document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && !document.getElementById('loginScreen').classList.contains('hidden')) {
        login();
    }
});