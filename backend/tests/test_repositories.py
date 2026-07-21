import unittest
import asyncio
from unittest.mock import AsyncMock, MagicMock
from repositories.activity_repository import ActivityRepository
from repositories.coach_memory_repository import MemoryRepository
from repositories.wellness_state_repository import WellnessStateRepository

class TestRepositories(unittest.TestCase):
    def setUp(self):
        self.db = MagicMock()
        self.collection = MagicMock()
        self.db.__getitem__.return_value = self.collection

    async def async_test_activity_repository(self):
        repo = ActivityRepository(self.db)
        
        # Test log_event
        mock_result = MagicMock()
        mock_result.inserted_id = "event123"
        self.collection.insert_one = AsyncMock(return_value=mock_result)
        res = await repo.log_event(
            user_id="user123",
            source_collection="assessments",
            event_type="assessment",
            title="title",
            description="desc"
        )
        self.assertEqual(res, "event123")

        # Test get_user_timeline
        mock_cursor = MagicMock()
        mock_cursor.sort.return_value = mock_cursor
        mock_cursor.to_list = AsyncMock(return_value=[{"_id": "event123", "user_id": "user123"}])
        self.collection.find.return_value = mock_cursor
        
        timeline = await repo.get_user_timeline("user123")
        self.assertEqual(len(timeline), 1)
        self.assertEqual(timeline[0]["_id"], "event123")

    async def async_test_memory_repository(self):
        repo = MemoryRepository(self.db)

        # Test get_memory when none exists
        self.collection.find_one = AsyncMock(return_value=None)
        memory = await repo.get_memory("user123")
        self.assertEqual(memory["user_id"], "user123")
        self.assertEqual(memory["known_stressors"], [])

        # Test save_or_update_memory
        mock_result = MagicMock()
        mock_result.inserted_id = "mem123"
        self.collection.insert_one = AsyncMock(return_value=mock_result)
        self.collection.find_one = AsyncMock(return_value=None)
        
        res = await repo.save_or_update_memory("user123", {"known_stressors": ["work"]})
        self.assertEqual(res, "mem123")

    async def async_test_wellness_state_repository(self):
        repo = WellnessStateRepository(self.db)

        # Test get_state
        self.collection.find_one = AsyncMock(return_value={"_id": "state123", "wellness_score": 75})
        state = await repo.get_state("user123")
        self.assertEqual(state["wellness_score"], 75)

    def test_all(self):
        loop = asyncio.new_event_loop()
        try:
            loop.run_until_complete(self.async_test_activity_repository())
            loop.run_until_complete(self.async_test_memory_repository())
            loop.run_until_complete(self.async_test_wellness_state_repository())
        finally:
            loop.close()
