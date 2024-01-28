#include "gtest/gtest.h"
#include "Logging/Logger.hpp"
#include "TestHelpers/Logging/TestLogBackend.hpp"
//setup the global test environment before any of the tests run
class ELSFEnvironment : public ::testing::Environment {
public:
    void SetUp() override {
        ELSF_LOG_INIT(new TestLogBackend<ELSF_LOG_MAX_MESSAGE_LENGTH, 8>());
    }
};

