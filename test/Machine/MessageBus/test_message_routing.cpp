#include "Logging/Logger.hpp"
#include "Mocks/Logging/MockLogBackend.hpp"
#include "Machine/MessageBus/Messages.hpp"

#include "TestHelpers/DefaultUnitTest.hpp"
#include "TestHelpers/Logging/LoggingUnitTest.hpp"
#include "Machine/MessageBus/Subscription.hpp"
#include "Machine/MessageBus/Broker.hpp"
#include "Machine/FSM/Machine.hpp"
#include "Machine/MessageBus/MachineRouter.hpp"
#include "Mocks/Machine/FSM/MockMachine.hpp"

#include <gmock/gmock.h>
#include <gtest/gtest.h>

using namespace Machine::MessageBus;
using namespace Machine::FSM;
using namespace Mocks::Machine::FSM;

class MachineSubscriptionIntegrationTest : public DefaultUnitTest {
    
};

TEST_F(MachineSubscriptionIntegrationTest, should_send_start_message_to_machine) {
//GTEST_SKIP();
    MockMachine fsm;
    Broker broker;

    EXPECT_CALL(fsm, ExecuteStartMock()).Times(1);

    MachineRouter machineRouter(fsm);

    Subscription machineSubscription = Subscription(machineRouter, machineRouter.GetValidMessagesList());

    broker.subscribe(machineSubscription);

    StartMessage startMessage;

    broker.receive(startMessage);

    machineRouter.ProcessQueue();

}

TEST_F(MachineSubscriptionIntegrationTest, constructor_starts_fsm) 
{
    MockMachine fsm;

    MachineRouter machineRouter(fsm);

    EXPECT_TRUE(fsm.is_started());
}

class MessageRouterLoggingTest : public LoggerTest
{
};

TEST_F(MessageRouterLoggingTest, MessageRouter_logs_unknown_message) {
    Mocks::Logging::MockLogBackend<ELSF_LOG_MAX_MESSAGE_LENGTH> mockBackend;
    bool result = LogFactory<256>::Create(mockBackend);
    ASSERT_TRUE(result);
    EXPECT_CALL(mockBackend, LogFormattedWarn(testing::_)).Times(1);
    EXPECT_CALL(mockBackend, LogFormattedInfo(testing::_)); //just because the FSM logs info when it starts
    MockMachine fsm;
    MachineRouter machineRouter(fsm);
    StartMessage startMessage;

    machineRouter.on_receive_unknown(startMessage);
    LogSingleton::destroy();
}