import unittest
from backend.cinema_engine import Character, EngineError, Project, Shot, prepare_workflow

class EngineTests(unittest.TestCase):
    def test_character_and_negative_deduplication(self):
        p=Project("demo", characters={"hero":Character(name="Mara",hair="dark hair",avoid=["identity drift","watermark"])}, shots=[Shot("a","walking in rain",character="hero",negative_prompt="blur, watermark")])
        p.validate()
        self.assertIn("Mara",p.positive(p.shots[0]))
        self.assertEqual(p.negative(p.shots[0]).count("watermark"),1)
    def test_unknown_character_rejected(self):
        with self.assertRaises(EngineError): Project("demo",shots=[Shot("a","x",character="missing")]).validate()
    def test_duplicate_shot_ids_rejected(self):
        with self.assertRaises(EngineError): Project("demo",shots=[Shot("a","x"),Shot("a","y")]).validate()
    def test_invalid_duration_rejected(self):
        with self.assertRaises(EngineError): Project("demo",shots=[Shot("a","x",duration_seconds=0)]).validate()
    def test_workflow_explicit_mapping(self):
        wf={"4":{"inputs":{"text":"old"}},"5":{"inputs":{"text":"old negative"}}}
        out=prepare_workflow(wf,"positive","negative",{"4":"positive","5":"negative"})
        self.assertEqual(out["4"]["inputs"]["text"],"positive")
        self.assertEqual(out["5"]["inputs"]["text"],"negative")
        self.assertEqual(wf["4"]["inputs"]["text"],"old")
    def test_invalid_workflow_mapping_rejected(self):
        with self.assertRaises(EngineError): prepare_workflow({}, "p","n",{"404":"positive"})

if __name__ == "__main__": unittest.main()
