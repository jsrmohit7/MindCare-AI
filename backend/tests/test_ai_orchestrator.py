import unittest
from unittest.mock import MagicMock, patch
from services.ai_orchestrator import (
    BaseLLMProvider,
    AIOrchestrator,
    GraniteProvider,
    AIConfigError,
    AIAuthError
)

class DummyProvider(BaseLLMProvider):
    def generate_text(self, system_prompt, messages, params=None):
        return {"text": "dummy text", "latency": 0.1, "input_tokens": 10, "output_tokens": 10}
        
    def generate_json(self, system_prompt, prompt, schema=None, params=None):
        return {"text": '{"result": "success"}', "data": {"result": "success"}, "latency": 0.1}

class TestAIOrchestrator(unittest.TestCase):
    def test_provider_text_generation(self):
        orchestrator = AIOrchestrator(provider=DummyProvider())
        res = orchestrator.generate_text("system", [{"role": "user", "content": "hello"}])
        self.assertEqual(res["text"], "dummy text")

    def test_provider_json_generation(self):
        orchestrator = AIOrchestrator(provider=DummyProvider())
        res = orchestrator.generate_json("system", "hello")
        self.assertEqual(res["data"]["result"], "success")

    def test_granite_provider_config_missing(self):
        with patch.dict('os.environ', {}, clear=True):
            with self.assertRaises(AIConfigError):
                GraniteProvider()
