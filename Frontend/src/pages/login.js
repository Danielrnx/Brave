// Aguardando o envio do formulário de login
document.querySelector('form').addEventListener('submit', async function (event) {
    event.preventDefault(); // Previne o envio padrão do formulário

    // Obter os dados inseridos pelo usuário
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Definir a URL do backend para autenticação
    const loginUrl = 'http://localhost:5000/api/login'; // Substitua pela URL do seu backend

    // Dados para enviar ao backend
    const data = {
        username,
        password
    };

    try {
        // Realizar a requisição de login
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        // Verificar se a resposta foi bem-sucedida
        if (response.ok) {
            // Caso de sucesso, salvar o token JWT no localStorage ou sessionStorage
            const result = await response.json();
            localStorage.setItem('authToken', result.token); // Salva o token no localStorage

            // Redirecionar para a página principal após login
            window.location.href = 'home.html'; // Altere para a página de destino após o login
        } else {
            // Caso de erro, mostrar mensagem
            const error = await response.json();
            alert(error.message || 'Erro ao realizar login. Verifique suas credenciais.');
        }
    } catch (error) {
        // Caso de erro na requisição
        console.error('Erro na requisição:', error);
        alert('Erro ao conectar ao servidor. Tente novamente mais tarde.');
    }
});

