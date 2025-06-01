from flask import Flask, request, jsonify, render_template
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM 
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)

MODEL_NAME = "pierreguillou/gpt2-small-portuguese"
chatbot_pipeline = None

try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)
    chatbot_pipeline = pipeline("text-generation", model=model, tokenizer=tokenizer)
    logging.info(f"Modelo Hugging Face '{MODEL_NAME}' carregado com sucesso.")  
    
except Exception as e:
    logging.error(f"Erro ao carregar o modelo Hugging Face '{MODEL_NAME}': {e}")
    chatbot_pipeline = None # Garante que o pipeline é None se houver erro

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    if not chatbot_pipeline:
        return jsonify({"response": "Desculpe, o chatbot não está disponível no momento devido a um problema de carregamento do modelo."}), 500

    user_message = request.json.get('message')
    if not user_message:
        return jsonify({"response": "Por favor, digite uma mensagem."}), 400  
      
    logging.info(f"Mensagem do usuário recebida: '{user_message}'")

    try:
        response_data = chatbot_pipeline(
            user_message,
            max_new_tokens=60, # Número máximo de tokens a serem gerados    
            num_return_sequences=1, # Número de sequências a serem retornadas                              
            do_sample=True, # Para amostragem em vez de busca
            temperature=0.7, # Para controlar a aleatoriedade
            repetition_penalty=1.2, # Para evitar repetições  
            top_k=50, # Para limitar o número de palavras a considerar
            top_p=0.95, # Para limitar a probabilidade cumulativa
            pad_token_id=chatbot_pipeline.tokenizer.eos_token_id # Para evitar warnings com alguns modelos
        )    
        generated_text = response_data[0]['generated_text']
    
        if generated_text.startswith(user_message):
            chatbot_response = generated_text[len(user_message):].strip()
        else:
            chatbot_response = generated_text.strip()
        if not chatbot_response:
            chatbot_response = "Não entendi bem. Pode reformular?"
    except Exception as e:
        logging.error(f"Erro ao gerar resposta: {e}")
        return jsonify({"response": "Desculpe, ocorreu um erro ao processar sua mensagem."}), 500

    logging.info(f"Resposta do modelo: '{response_data[0]['generated_text']}'")
    return jsonify({"response": response_data[0]['generated_text']})

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
