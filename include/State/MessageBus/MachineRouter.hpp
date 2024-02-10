#pragma once

#include "State/MessageBus/Messages.hpp"
#include "State/Machine/Machine.hpp"
#include "State/MessageBus/Router.hpp"

#include <etl/hfsm.h>

namespace State
{
namespace MessageBus
{


//NOTE TO CHRIS. THIS IS THE ROUTER THAT THE BROKER CALLS, STOP TRYING TO MAKE IT THE BROKER
class MachineRouter 
    : public State::MessageBus::QueuedRouter<
    MachineRouter, 
    10, //Queue Depth
    StartMessage, 
    StartAtMessage, 
    StopMessage, 
    StopAtMessage, 
    EStopMessage, 
    ResetMessage>
{
public:
    explicit MachineRouter(State::Machine::Machine* fsm) : myFsm(fsm)
    {
    }

    void on_receive(const StartMessage& msg);
    void on_receive(const StartAtMessage& msg);
    void on_receive(const StopMessage& msg);
    void on_receive(const StopAtMessage& msg);
    void on_receive(const EStopMessage& msg);
    void on_receive(const ResetMessage& msg);
    void on_receive_unknown(const etl::imessage& msg);

private:
    etl::hfsm* myFsm;
};

} // namespace Machine
} // namespace State